#!/usr/bin/env python3
"""Local, reversible prototype v2: flash-triggered, surface-anchored material dissolution of the
closed cell door in the current `corridor-to-painter` clip (C7 corridor -> artist room).

Rejected v1 (see ../rejected-v1/REJECTED.md) looked like a fire/flame blob and used a crude
blurred still as the room behind the door. v2 keeps the same measured camera model (it fit the
source tightly, residual <0.007 over 27 frames) but fixes the look:
  - debris is colour-sampled from the real door paint, not gold/fire
  - the "room beyond" layer is built from the REAL post-passage frames, time-warped by the same
    camera model, instead of a single blurred still
  - the dissolve front is fine-grained (small chips), not one fractal blob
  - debris density always covers the erosion edge, so no instant shows a flat alpha "hole"
  - delivers a short 3 s window (72 frames @24fps) with real motion before and after the effect,
    per the brief ("2-4 sekunder demonstrasjon med nabobevegelse")

Usage: python3 render_door_passage_v2.py SOURCE.mp4 OUTDIR
Needs: ffmpeg, numpy, opencv-python-headless.
Source: corridor-to-painter-passage-91a39873174ce62d.mp4 (sha256 91a39873...e487), the only closed,
real, currently-published door passage between two rooms in the production media set (the earlier
cell entry uses a window, not a door, per manifest-current.json locationReconstruction, and is
separately flagged in requestedMediaReplacements as needing new media -- not something to invent).
"""
import os, subprocess, sys
import cv2
import numpy as np

W, H = 1280, 720
# Camera model, measured by SIFT+RANSAC similarity-transform tracking on frames 101-127
# (see measure_camera.py): Zd(t) is distance to the door plane relative to frame 100.
FOE = np.array([565.3, 337.9])
SLOPE = -0.02203
def Zd(t): return 1.0 + SLOPE * (np.asarray(t, dtype=np.float64) - 100.0)
Z110 = float(Zd(110))

DOOR_FRAME = 104          # sharp door texture, before the source's own native glitter artifact starts
ROOM_FRAME = 146          # first clean, fully-inside-the-room frame; used as the real "beyond" plate
OPEN_RECT = (430.0, 104.0, 692.0, 760.0)   # metal leaf opening inside the orange frame, plane pixels at frame 104
SLOT = np.array([557.0, 251.0])            # viewing-slot position = flash origin, plane pixels

T_START, T_FLASH, T_DONE = 112, 115.0, 136.0   # effect window
F0, F1 = 100, 172                              # delivered clip: 72 frames = 3.0s @24fps

GX, GY = np.meshgrid(np.arange(W, dtype=np.float64), np.arange(H, dtype=np.float64))
GRID = np.stack([GX, GY], -1)

def warp_scale(img, s):
    M = np.float32([[s, 0, FOE[0] * (1 - s)], [0, s, FOE[1] * (1 - s)]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

def screen_to_plane(t): return FOE + (GRID - FOE) * (Zd(t) / Z110)

def hashf(ix, iy, seed):
    n = (ix * 374761393 + iy * 668265263 + seed * 1442695041) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFF) / 65535.0

def vnoise(px, py, seed):
    xi = np.floor(px).astype(np.int64); yi = np.floor(py).astype(np.int64)
    fx = px - xi; fy = py - yi; u = fx * fx * (3 - 2 * fx); v = fy * fy * (3 - 2 * fy)
    a = hashf(xi, yi, seed); b = hashf(xi + 1, yi, seed); c = hashf(xi, yi + 1, seed); d = hashf(xi + 1, yi + 1, seed)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v

def fbm(P, seed, cell, octaves=3):
    out = np.zeros(P.shape[:-1]); amp = 1.0; tot = 0.0; f = 1.0 / cell
    for o in range(octaves):
        out += amp * vnoise(P[..., 0] * f, P[..., 1] * f, seed + o * 17); tot += amp; amp *= 0.5; f *= 2.0
    return out / tot

# A fine-grained, mostly-radial erosion front (small chip-scale noise, not one giant blob).
def front_field(P):
    d = np.hypot(P[..., 0] - SLOT[0], P[..., 1] - SLOT[1]) / 520.0
    fine = fbm(P, 11, cell=34.0, octaves=3)
    return 0.80 * d + 0.20 * fine

def threshold(t):
    return -0.03 + 0.78 * np.clip((t - (T_START - 1.0)) / (T_DONE - (T_START - 1.0)), 0, 1) ** 1.05

def smoothstep(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)


class Debris:
    """Small paint/metal chips that detach exactly where the erosion front passes, coloured from
    the real door texture, with a brief flash-lit highlight near the slot. No large blurred blobs."""
    def __init__(self, door_tex, rng):
        self.door_tex = door_tex; self.rng = rng
        self.P = np.zeros((0, 2)); self.t0 = np.zeros(0); self.life = np.zeros(0)
        self.vz = np.zeros(0); self.lat = np.zeros((0, 2)); self.col = np.zeros((0, 3)); self.size = np.zeros(0)

    def emit(self, t, n=70):
        s = Z110 / float(Zd(t)); half = np.array([W, H]) / 2.0 / s + 140
        cand = FOE + (self.rng.random((n * 14, 2)) * 2 - 1) * half
        inside = (cand[:, 0] > OPEN_RECT[0]) & (cand[:, 0] < OPEN_RECT[2]) & (cand[:, 1] > OPEN_RECT[1]) & (cand[:, 1] < OPEN_RECT[3])
        F = front_field(cand); Tt = threshold(t)
        band = np.abs(F - Tt) < 0.018
        P = cand[inside & band][:n]
        if not len(P): return
        xy = FOE + (P - FOE) * (Z110 / float(Zd(DOOR_FRAME)))
        xi = np.clip(xy[:, 0].astype(int), 0, W - 1); yi = np.clip(xy[:, 1].astype(int), 0, H - 1)
        col = self.door_tex[yi, xi].astype(np.float64)
        nn = len(P)
        self.P = np.vstack([self.P, P]); self.t0 = np.r_[self.t0, np.full(nn, t)]
        self.life = np.r_[self.life, self.rng.uniform(10, 20, nn)]
        self.vz = np.r_[self.vz, self.rng.uniform(0.016, 0.027, nn)]
        ang = self.rng.uniform(0, 2 * np.pi, nn); spd = self.rng.uniform(0.3, 1.6, nn)
        self.lat = np.vstack([self.lat, np.stack([np.cos(ang) * spd, np.sin(ang) * spd], -1)])
        self.col = np.vstack([self.col, col])
        self.size = np.r_[self.size, np.where(self.rng.random(nn) < 0.12, self.rng.uniform(2.2, 3.6, nn), self.rng.uniform(0.8, 1.8, nn))]

    def draw(self, t):
        age = t - self.t0; alive = (age >= 0) & (age < self.life)
        if not alive.any(): return np.zeros((H, W, 3), np.float32), np.zeros((H, W), np.float32)
        P = self.P[alive]; a = age[alive]; life = self.life[alive]; col = self.col[alive]; size = self.size[alive]
        lat = self.lat[alive]; vz = self.vz[alive]
        Pt = P + lat * np.minimum(a, 6)[:, None] * 0.9                     # scatter outward, then settle
        z = vz * a
        zrel = Zd(t) + z
        ok = zrel > 0.04
        xy = FOE + (Pt - FOE) * (Z110 / zrel)[:, None]
        sc = Z110 / zrel
        fade = np.clip(a / 1.2, 0, 1) * np.clip((life - a) / 5.0, 0, 1)
        d_flash = np.hypot(P[:, 0] - SLOT[0], P[:, 1] - SLOT[1])
        heat = np.exp(-a / 3.0) * np.exp(-(d_flash / 340.0) ** 2)
        heat = np.clip(heat, 0, 1)
        c = col * (1 - heat[:, None] * 0.6) + np.array([225, 238, 248.0]) * (heat[:, None] * 0.6)
        c = c * (0.65 + 0.5 * np.exp(-a / 7.0))[:, None]
        r = np.clip(size * sc, 0.6, 6.0)
        m = ok & (xy[:, 0] > -10) & (xy[:, 0] < W + 10) & (xy[:, 1] > -10) & (xy[:, 1] < H + 10)
        xy, c, r, fade = xy[m], c[m], r[m], fade[m]
        layer = np.zeros((H, W, 3), np.float32); cover = np.zeros((H, W), np.float32)
        xi = np.clip(np.round(xy[:, 0]).astype(int), 0, W - 1); yi = np.clip(np.round(xy[:, 1]).astype(int), 0, H - 1)
        np.add.at(layer, (yi, xi), (c * fade[:, None]).astype(np.float32))
        np.add.at(cover, (yi, xi), (fade * np.clip(r, 1, 3)).astype(np.float32))
        layer = cv2.GaussianBlur(layer, (0, 0), 0.6)
        cover = cv2.GaussianBlur(cover, (0, 0), 1.1) * 2.2
        return layer, np.clip(cover, 0, 1)


def grab_frames(src, tmp):
    os.makedirs(tmp, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vsync", "0", "-start_number", "0",
                     os.path.join(tmp, "src_%03d.png")], check=True)

def render(src, out):
    tmp = os.path.join(out, "_frames"); grab_frames(src, tmp)
    fr = lambda n: cv2.imread(os.path.join(tmp, "src_%03d.png" % n))
    door_tex = fr(DOOR_FRAME); room_plate = fr(ROOM_FRAME)
    rng = np.random.default_rng(11)
    deb = Debris(door_tex, rng)
    out_dir = os.path.join(tmp, "out"); os.makedirs(out_dir, exist_ok=True)
    for t in range(F0, F1 + 1):
        if T_START - 2 <= t <= T_DONE + 3:
            deb.emit(t)
        orig = fr(t)
        if t < T_START or t > T_DONE + 6:
            res = orig.astype(np.float32)
        else:
            P = screen_to_plane(t)
            F = front_field(P); Tt = threshold(t)
            M = smoothstep((Tt - F) / 0.05)                         # 1 = material gone at this pixel
            Oin = ((P[..., 0] > OPEN_RECT[0]) & (P[..., 0] < OPEN_RECT[2]) & (P[..., 1] > OPEN_RECT[1]) & (P[..., 1] < OPEN_RECT[3])).astype(np.float32)
            Oin = cv2.GaussianBlur(Oin, (0, 0), 1.0)
            door_now = warp_scale(door_tex, Zd(DOOR_FRAME) / float(Zd(t)))
            s_room = Zd(ROOM_FRAME) / float(Zd(t))
            room_now = warp_scale(room_plate, s_room)
            layer, cover = deb.draw(t)
            rim = np.exp(-((F - Tt) / 0.012) ** 2) * (1 - M) * Oin
            door_lit = door_now.astype(np.float32) + rim[..., None] * np.array([40, 95, 170], np.float32) * 0.5
            beyond = room_now.astype(np.float32) * np.clip(M - cover, 0, 1)[..., None] + door_lit * np.clip(1 - M + cover, 0, 1)[..., None]
            inside = beyond + layer
            res = orig.astype(np.float32) * (1 - Oin[..., None]) + inside * Oin[..., None]
            sp = FOE + (SLOT - FOE) * (Z110 / float(Zd(t)))
            flashI = 0.55 * np.exp(-((t - T_FLASH) / 1.1) ** 2)
            rr = np.hypot(GX - sp[0], GY - sp[1]) / (95.0 * (Z110 / float(Zd(t))))
            fl = flashI * np.exp(-rr ** 2)
            res = res + (fl[..., None] * np.array([235, 245, 255], np.float32)) * Oin[..., None]
        res = np.clip(res, 0, 255).astype(np.uint8)
        cv2.imwrite(os.path.join(out_dir, "f_%03d.png" % t), res)
        print("frame", t, flush=True)
    return out_dir

if __name__ == "__main__":
    src, out = sys.argv[1], sys.argv[2]
    frames_dir = render(src, out)
    cmd = ["ffmpeg", "-v", "error", "-y", "-framerate", "24", "-start_number", str(F0),
           "-i", os.path.join(frames_dir, "f_%03d.png"), "-frames:v", str(F1 - F0 + 1),
           "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-pix_fmt", "yuv420p",
           os.path.join(out, "door-passage-v2.mp4")]
    print(" ".join(cmd)); subprocess.run(cmd, check=True)
