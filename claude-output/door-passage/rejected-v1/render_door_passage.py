#!/usr/bin/env python3
"""Local, reversible prototype: flash-triggered, surface-anchored particle dissolution of the
closed cell door in the current `corridor-to-painter` clip (C7 corridor -> artist room).

Usage: python3 render_door_passage.py SOURCE.mp4 OUTDIR [first_frame last_frame]
Needs: ffmpeg, numpy, opencv-python-headless. The source must be the validated
corridor-to-painter-passage-91a39873174ce62d.mp4 (sha256 91a39873...e487). Nothing is written
outside OUTDIR and the source is never modified.

Camera model (measured, see MEASUREMENTS in README-door-passage.md): the camera moves at constant
speed straight at the door plane. Z(t)=1-0.02203*(t-100) is the distance to the plane in units of
its distance at frame 100; the focus of expansion is FOE. Everything that belongs to the door plane
is addressed in plane coordinates P (pixels of frame 110), so the dissolve front, noise and particle
emitters stay glued to the door as the camera approaches.
"""
import os, subprocess, sys
import cv2
import numpy as np

# ---- camera / plane model (measured on the source) --------------------------------------------
W, H = 1280, 720
FOE = np.array([565.3, 337.9])
SLOPE = -0.02203
def Zd(t): return 1.0 + SLOPE * (np.asarray(t, dtype=np.float64) - 100.0)
Z110 = float(Zd(110))
OPENING = (262.0, 20.0, 848.0, 1100.0)      # x0,y0,x1,y1 in plane pixels: the opening between the outer jambs
SLOT = np.array([557.0, 251.0])             # viewing slot = flash origin, plane pixels

# ---- effect parameters (all tunable) ------------------------------------------------------------
T_START, T_FLASH, T_END_DISSOLVE = 114, 115.5, 139.0
BASE_FRAME = 116        # last frame before the source's own glitter starts: door texture for t>BASE_FRAME
TH = 144                # first clean room frame: handover to the untouched source, and the room "card"
ROOM_DEPTH = 1.2        # depth of the room behind the plane, same units as Z (card parallax)
SEED = 7
EMIT_PER_FRAME = 260
PART_VZ = (0.021, 0.034)   # world speed of particles along the camera axis, per frame (camera: 0.022)
PART_LIFE = (14, 34)
FUNNEL = 0.02             # lateral pull toward the camera axis per frame


def smooth(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)

def hashf(ix, iy, seed):
    n = (ix * 374761393 + iy * 668265263 + seed * 1442695041) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFF) / 65535.0

def vnoise(px, py, seed):
    xi = np.floor(px).astype(np.int64); yi = np.floor(py).astype(np.int64)
    fx = px - xi; fy = py - yi; u = fx * fx * (3 - 2 * fx); v = fy * fy * (3 - 2 * fy)
    a = hashf(xi, yi, seed); b = hashf(xi + 1, yi, seed); c = hashf(xi, yi + 1, seed); d = hashf(xi + 1, yi + 1, seed)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v

def fbm(P, seed=SEED, cell=130.0, octaves=3):
    out = np.zeros(P.shape[:-1]); amp = 1.0; tot = 0.0; f = 1.0 / cell
    for o in range(octaves):
        out += amp * vnoise(P[..., 0] * f, P[..., 1] * f, seed + o * 17); tot += amp; amp *= 0.5; f *= 2.0
    return out / tot

RMAX = 900.0
def front_field(P):
    d = np.hypot(P[..., 0] - SLOT[0], P[..., 1] - SLOT[1]) / RMAX
    return 0.72 * d + 0.28 * fbm(P)

def threshold(t):
    return -0.06 + 1.02 * np.clip((t - (T_START - 0.5)) / (T_END_DISSOLVE - (T_START - 0.5)), 0, 1) ** 1.05

GX, GY = np.meshgrid(np.arange(W, dtype=np.float64), np.arange(H, dtype=np.float64))
GRID = np.stack([GX, GY], -1)
def screen_to_plane(t): return FOE + (GRID - FOE) * (Zd(t) / Z110)
def plane_to_screen(P, t, z=0.0): return FOE + (P - FOE) * (Z110 / (Zd(t) + z))[..., None] if np.ndim(z) else FOE + (P - FOE) * (Z110 / (Zd(t) + z))

def warp_scale(img, s, border=cv2.BORDER_REPLICATE):
    M = np.float32([[s, 0, FOE[0] * (1 - s)], [0, s, FOE[1] * (1 - s)]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=border)


class Particles:
    def __init__(self, base_bgr, rng):
        self.rng = rng; self.base = base_bgr
        self.P = np.zeros((0, 2)); self.t0 = np.zeros(0); self.vz = np.zeros(0); self.life = np.zeros(0)
        self.col = np.zeros((0, 3)); self.size = np.zeros(0); self.seed = np.zeros(0)

    def emit(self, t):
        s = Z110 / float(Zd(t)); half = np.array([W, H]) / 2.0 / s + 160
        P = FOE + (self.rng.random((EMIT_PER_FRAME * 10, 2)) * 2 - 1) * half
        inside = (P[:, 0] > OPENING[0]) & (P[:, 0] < OPENING[2]) & (P[:, 1] > OPENING[1]) & (P[:, 1] < OPENING[3])
        F = front_field(P); T = threshold(t); band = np.abs(F - T) < 0.035
        P = P[inside & band][:EMIT_PER_FRAME]
        if not len(P): return
        # colour from the intact door texture
        sb = Z110 / float(Zd(BASE_FRAME)); xy = FOE + (P - FOE) * sb
        xi = np.clip(xy[:, 0].astype(int), 0, W - 1); yi = np.clip(xy[:, 1].astype(int), 0, H - 1)
        col = self.base[yi, xi].astype(np.float64)
        off = (xy[:, 0] < 0) | (xy[:, 0] >= W) | (xy[:, 1] < 0) | (xy[:, 1] >= H); col[off] = (60, 110, 175)  # BGR door brown
        n = len(P)
        self.P = np.vstack([self.P, P]); self.t0 = np.r_[self.t0, np.full(n, t)]
        self.vz = np.r_[self.vz, self.rng.uniform(*PART_VZ, n)]; self.life = np.r_[self.life, self.rng.integers(PART_LIFE[0], PART_LIFE[1], n)]
        self.col = np.vstack([self.col, col]); self.size = np.r_[self.size, np.where(self.rng.random(n) < 0.18, self.rng.uniform(2.6, 4.6, n), self.rng.uniform(0.8, 2.0, n))]
        self.seed = np.r_[self.seed, self.rng.random(n) * 1000]

    def state(self, t):
        age = t - self.t0; alive = (age >= 0) & (age < self.life)
        P = self.P[alive]; a = age[alive]; vz = self.vz[alive]
        # funnel toward the camera axis and a little curl so the stream is not rigid
        pull = 1 - (1 - FUNNEL) ** a
        Pt = FOE + (P - FOE) * (1 - pull)[:, None]
        sd = self.seed[alive]
        Pt = Pt + np.stack([np.sin(a * 0.35 + sd) * 11.0, np.cos(a * 0.31 + sd * 1.3) * 11.0], -1) * np.minimum(1, a / 6)[:, None]
        z = vz * a
        return alive, Pt, z, a

    def draw(self, t, sub=(0.0, -0.35)):
        """Returns (beyond_rgb, beyond_a, surface_rgb) layers, float32 HxWx3/1."""
        beyond = [np.zeros((H, W, 3), np.float32) for _ in range(3)]; surf = np.zeros((H, W, 3), np.float32)
        glow = np.zeros((H, W, 3), np.float32)
        for dt in sub:
            tt = t + dt
            alive, Pt, z, a = self.state(tt)
            if not len(Pt): continue
            zrel = Zd(tt) + z
            ok = zrel > 0.05
            xy = FOE + (Pt - FOE) * (Z110 / zrel)[:, None]
            sc = Z110 / zrel
            life = self.life[alive]; col = self.col[alive]; size = self.size[alive]
            fade = np.minimum(1, a / 2.0) * np.clip((life - a) / 8.0, 0, 1) * np.clip((zrel - 0.05) / 0.12, 0, 1)
            heat = np.exp(-a / 5.0) * (size < 2.4)
            gold = np.array([95, 205, 255.0])        # BGR hot gold
            c = col * (1 - heat[:, None] * 0.85) + gold * (heat[:, None] * 0.85)
            c = c * (0.55 + 0.9 * np.exp(-a / 10.0))[:, None]
            r = np.clip(size * sc * 1.1, 0.7, 14.0)
            m = ok & (xy[:, 0] > -20) & (xy[:, 0] < W + 20) & (xy[:, 1] > -20) & (xy[:, 1] < H + 20)
            xy, c, r, fade, a_, z_ = xy[m], c[m], r[m], fade[m], a[m], z[m]
            xi = np.clip(np.round(xy[:, 0]).astype(int), 0, W - 1); yi = np.clip(np.round(xy[:, 1]).astype(int), 0, H - 1)
            surfmask = (z_ < 0.02) & (a_ < 2.5)
            for k, (lo, hi) in enumerate(((0, 1.8), (1.8, 4.5), (4.5, 99))):
                sel = (r >= lo) & (r < hi) & ~surfmask
                if sel.any(): np.add.at(beyond[k], (yi[sel], xi[sel]), (c[sel] * fade[sel, None]).astype(np.float32) * (1.0 / len(sub)))
            if surfmask.any(): np.add.at(surf, (yi[surfmask], xi[surfmask]), (c[surfmask] * fade[surfmask, None]).astype(np.float32) * (1.0 / len(sub)))
        sig = (0.9, 2.0, 4.2)
        lay = sum(cv2.GaussianBlur(beyond[k], (0, 0), sig[k]) * (sig[k] ** 2 * 5.0) for k in range(3))
        sf = cv2.GaussianBlur(surf, (0, 0), 1.2) * 7.0
        return lay, sf


def build_card(room_bgr):
    """Room view from the first clean room frame, with the jamb strip at the left replaced
    (reflection + blur) so no jamb appears inside the aperture before the camera reaches it."""
    c = room_bgr.copy(); x0 = 58
    c[:, :x0] = cv2.GaussianBlur(c[:, x0:x0 + 1].repeat(x0, axis=1), (0, 0), 3)
    return c

def render(src, out, f0, f1):
    os.makedirs(out, exist_ok=True); tmp = os.path.join(out, "_frames"); os.makedirs(tmp, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vsync", "0", "-start_number", "0", os.path.join(tmp, "src_%03d.png")], check=True)
    fr = lambda n: cv2.imread(os.path.join(tmp, "src_%03d.png" % n))
    base = fr(BASE_FRAME); card = build_card(fr(TH))
    rng = np.random.default_rng(SEED); parts = Particles(base, rng)
    for t in range(min(f0, T_START), f1 + 1):
        if T_START <= t <= T_END_DISSOLVE + 2: parts.emit(t)
        if t < f0: continue
        orig = fr(t)
        if t < T_START: res = orig
        else:
            lay, sf = parts.draw(t)
            if t >= TH:
                res = orig.astype(np.float32) + lay * 0.9
                res[:, :170] = orig[:, :170]   # the left jamb strip is nearer than the particles
            else:
                P = screen_to_plane(t)
                F = front_field(P); T = threshold(t)
                M = smooth((T - F) / 0.07)                                      # 1 = door gone
                O = ((P[..., 0] > OPENING[0]) & (P[..., 0] < OPENING[2]) & (P[..., 1] > OPENING[1]) & (P[..., 1] < OPENING[3])).astype(np.float32)
                O = cv2.GaussianBlur(O, (0, 0), 1.0)
                door = orig if t <= BASE_FRAME else warp_scale(base, Zd(BASE_FRAME) / float(Zd(t)))
                s_room = (float(Zd(TH)) + ROOM_DEPTH) / (float(Zd(t)) + ROOM_DEPTH)
                room = warp_scale(card, s_room)
                rim = np.exp(-((F - T) / 0.014) ** 2) * (1 - M) * O                 # hot rim on the surviving door
                door_lit = door.astype(np.float32) + rim[..., None] * np.array([55, 125, 215], np.float32) * 0.55
                inside = room.astype(np.float32) + lay * 1.0 * 1.0                  # beyond-plane particles over the room
                inside = inside * M[..., None] + door_lit * (1 - M[..., None])      # door occludes what is behind it
                inside = inside + sf                                                # surface-shed sparks sit on top
                res = orig.astype(np.float32) * (1 - O[..., None]) + inside * O[..., None]
                # flash: local, short, warm; light response on the door and the jamb near the slot
                sp = plane_to_screen(SLOT, t); sc = Z110 / float(Zd(t))
                I = 0.95 * np.exp(-((t - T_FLASH) / 1.5) ** 2) + 0.10 * np.exp(-np.clip(t - T_FLASH, 0, None) / 10.0) * (t > T_FLASH)
                rr = np.hypot(GX - sp[0], GY - sp[1]) / (130.0 * sc)
                fl = I * np.exp(-rr ** 2) * (0.6 + 0.4 * fbm(P * 1.0, SEED + 99))
                res = res + fl[..., None] * np.array([150, 215, 255], np.float32) * (1 - M[..., None] * 0.7)
        res = np.clip(res, 0, 255).astype(np.uint8)
        cv2.imwrite(os.path.join(tmp, "out_%03d.png" % t), res)
        print("frame", t, flush=True)
    return tmp


if __name__ == "__main__":
    src, out = sys.argv[1], sys.argv[2]
    f0 = int(sys.argv[3]) if len(sys.argv) > 3 else 96; f1 = int(sys.argv[4]) if len(sys.argv) > 4 else 156
    tmp = render(src, out, f0, f1)
    cmd = ["ffmpeg", "-v", "error", "-y", "-framerate", "24", "-start_number", str(f0), "-i", os.path.join(tmp, "out_%03d.png"),
           "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-pix_fmt", "yuv420p", "-r", "24", os.path.join(out, "door-passage-prototype.mp4")]
    print(" ".join(cmd)); subprocess.run(cmd, check=True)
