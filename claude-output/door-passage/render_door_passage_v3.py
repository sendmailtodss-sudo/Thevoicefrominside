#!/usr/bin/env python3
"""Local, reversible prototype v3: flash-triggered, surface-anchored material dissolution,
composited as an ADDITIVE debris layer on top of the unmodified original frames.

Why v3 differs from v1/v2 (both rejected/broken, kept in ../rejected-v1/ and ../rejected-v2.md):
v1 looked like a fire blob. v2 tried to re-synthesise the door and the room behind it by warping
two still frames with a camera model fitted only to frames 101-127; extrapolated past ~t=135 that
model's Zd(t) crosses zero and the warp blows up into flat colour blocks (visible at frames
132-144 of run3). Re-deriving a second, valid camera model for the room side was not worth the
risk for a small local test.

v3 never replaces any pixel of the source: the original camera, geometry, light and occlusion are
already correct in the real footage (including its own weak native fog/ghosting transition around
frames ~112-140). v3 only ADDS small, numerous, door-coloured debris chips on top, positioned with
the same measured camera model used only for SCATTER POSITIONING (forgiving of drift, since dots
do not need to be pixel-perfect), clamped to a safe depth floor so it can never blow up. A brief,
localised flash lights the chips near the viewing slot. Nothing is masked or cut away, so there is
no hole/portal/iris and no hidden join: the join is the same real, continuous dolly the camera plate
already contains, with material now visibly shedding from the door as it is crossed.

Usage: python3 render_door_passage_v3.py SOURCE.mp4 OUTDIR
Needs: ffmpeg, numpy, opencv-python-headless.
Source: corridor-to-painter-passage-91a39873174ce62d.mp4 (sha256 91a39873...e487).
"""
import os, subprocess, sys
import cv2
import numpy as np

W, H = 1280, 720
FOE = np.array([565.3, 337.9])
SLOPE = -0.02203
def Zd_raw(t): return 1.0 + SLOPE * (np.asarray(t, dtype=np.float64) - 100.0)
def Zd(t): return np.maximum(Zd_raw(t), 0.04)       # safety floor: positioning only, never image-warp
Z110 = float(Zd(110))

DOOR_FRAME = 104                               # sharp door texture reference for debris colour
OPEN_RECT = (430.0, 104.0, 692.0, 760.0)       # metal leaf opening, plane pixels at frame 104
SLOT = np.array([557.0, 251.0])                # viewing-slot position = flash origin, plane pixels

T_START, T_FLASH, T_FADE = 109, 114.0, 138.0   # debris active window
F0, F1 = 100, 172                              # delivered clip: 73 frames ~= 3.0s @24fps

GX, GY = np.meshgrid(np.arange(W, dtype=np.float64), np.arange(H, dtype=np.float64))


def hashf(ix, iy, seed):
    n = (ix * 374761393 + iy * 668265263 + seed * 1442695041) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFF) / 65535.0

def vnoise(px, py, seed):
    xi = np.floor(px).astype(np.int64); yi = np.floor(py).astype(np.int64)
    fx = px - xi; fy = py - yi; u = fx * fx * (3 - 2 * fx); v = fy * fy * (3 - 2 * fy)
    a = hashf(xi, yi, seed); b = hashf(xi + 1, yi, seed); c = hashf(xi, yi + 1, seed); d = hashf(xi + 1, yi + 1, seed)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v

def fbm(px, py, seed, cell, octaves=3):
    out = np.zeros_like(px); amp = 1.0; tot = 0.0; f = 1.0 / cell
    for o in range(octaves):
        out += amp * vnoise(px * f, py * f, seed + o * 17); tot += amp; amp *= 0.5; f *= 2.0
    return out / tot

def front_field(x, y):
    d = np.hypot(x - SLOT[0], y - SLOT[1]) / 620.0
    fine = fbm(x, y, 11, cell=30.0, octaves=3)
    return 0.78 * d + 0.22 * fine

def threshold(t):
    return -0.04 + 0.86 * np.clip((t - (T_START - 1.0)) / (T_FADE - (T_START - 1.0)), 0, 1) ** 1.05


class Debris:
    def __init__(self, door_tex, rng):
        self.door_tex = door_tex; self.rng = rng
        self.P = np.zeros((0, 2)); self.t0 = np.zeros(0); self.life = np.zeros(0)
        self.vz = np.zeros(0); self.lat = np.zeros((0, 2)); self.col = np.zeros((0, 3)); self.size = np.zeros(0)

    def emit(self, t, n=95):
        s = Z110 / float(Zd(t)); half = np.array([W, H]) / 2.0 / s + 120
        cand = FOE + (self.rng.random((n * 16, 2)) * 2 - 1) * half
        inside = (cand[:, 0] > OPEN_RECT[0]) & (cand[:, 0] < OPEN_RECT[2]) & (cand[:, 1] > OPEN_RECT[1]) & (cand[:, 1] < OPEN_RECT[3])
        F = front_field(cand[:, 0], cand[:, 1]); Tt = threshold(t)
        band = np.abs(F - Tt) < 0.022
        P = cand[inside & band][:n]
        if not len(P): return
        xy = FOE + (P - FOE) * (Z110 / float(Zd(DOOR_FRAME)))
        xi = np.clip(xy[:, 0].astype(int), 0, W - 1); yi = np.clip(xy[:, 1].astype(int), 0, H - 1)
        col = self.door_tex[yi, xi].astype(np.float64)
        nn = len(P)
        self.P = np.vstack([self.P, P]); self.t0 = np.r_[self.t0, np.full(nn, t)]
        self.life = np.r_[self.life, self.rng.uniform(11, 21, nn)]
        self.vz = np.r_[self.vz, self.rng.uniform(0.014, 0.024, nn)]
        ang = self.rng.uniform(0, 2 * np.pi, nn); spd = self.rng.uniform(0.25, 1.3, nn)
        self.lat = np.vstack([self.lat, np.stack([np.cos(ang) * spd, np.sin(ang) * spd], -1)])
        self.col = np.vstack([self.col, col])
        self.size = np.r_[self.size, np.where(self.rng.random(nn) < 0.10, self.rng.uniform(2.0, 3.2, nn), self.rng.uniform(0.7, 1.6, nn))]

    def draw(self, t):
        age = t - self.t0; alive = (age >= 0) & (age < self.life)
        if not alive.any(): return np.zeros((H, W, 3), np.float32)
        P = self.P[alive]; a = age[alive]; life = self.life[alive]; col = self.col[alive]; size = self.size[alive]
        lat = self.lat[alive]; vz = self.vz[alive]
        Pt = P + lat * np.minimum(a, 5)[:, None] * 0.85
        z = vz * a
        zrel = Zd(t) + z
        xy = FOE + (Pt - FOE) * (Z110 / zrel)[:, None]
        sc = Z110 / zrel
        fade = np.clip(a / 1.0, 0, 1) * np.clip((life - a) / 4.0, 0, 1)
        d_flash = np.hypot(P[:, 0] - SLOT[0], P[:, 1] - SLOT[1])
        heat = np.clip(np.exp(-a / 2.6) * np.exp(-(d_flash / 300.0) ** 2), 0, 1)
        c = col * (1 - heat[:, None] * 0.55) + np.array([222, 236, 246.0]) * (heat[:, None] * 0.55)
        c = c * ((0.6 + 0.5 * np.exp(-a / 6.0))[:, None])
        r = np.clip(size * sc, 0.5, 5.0)
        m = (xy[:, 0] > -10) & (xy[:, 0] < W + 10) & (xy[:, 1] > -10) & (xy[:, 1] < H + 10)
        xy, c, fade = xy[m], c[m], fade[m]
        layer = np.zeros((H, W, 3), np.float32)
        xi = np.clip(np.round(xy[:, 0]).astype(int), 0, W - 1); yi = np.clip(np.round(xy[:, 1]).astype(int), 0, H - 1)
        np.add.at(layer, (yi, xi), (c * fade[:, None]).astype(np.float32))
        return cv2.GaussianBlur(layer, (0, 0), 0.55)


def render(src, out):
    tmp = os.path.join(out, "_frames"); os.makedirs(tmp, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vsync", "0", "-start_number", "0",
                     os.path.join(tmp, "src_%03d.png")], check=True)
    fr = lambda n: cv2.imread(os.path.join(tmp, "src_%03d.png" % n))
    door_tex = fr(DOOR_FRAME)
    rng = np.random.default_rng(11); deb = Debris(door_tex, rng)
    out_dir = os.path.join(tmp, "out"); os.makedirs(out_dir, exist_ok=True)
    for t in range(F0, F1 + 1):
        if T_START - 2 <= t <= T_FADE + 4:
            deb.emit(t)
        orig = fr(t).astype(np.float32)
        if T_START <= t <= T_FADE + 8:
            layer = deb.draw(t)
            res = orig + layer
            sp = FOE + (SLOT - FOE) * (Z110 / float(Zd(t)))
            flashI = 0.42 * np.exp(-((t - T_FLASH) / 1.0) ** 2)
            rr = np.hypot(GX - sp[0], GY - sp[1]) / (85.0 * (Z110 / float(Zd(t))))
            fl = flashI * np.exp(-rr ** 2)
            res = res + fl[..., None] * np.array([230, 242, 252.0], np.float32)
        else:
            res = orig
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
           os.path.join(out, "door-passage-v3.mp4")]
    print(" ".join(cmd)); subprocess.run(cmd, check=True)
