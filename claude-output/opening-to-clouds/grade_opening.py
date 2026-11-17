#!/usr/bin/env python3
"""Unifying colour grade: pull every segment toward one cosmic-blue palette so the opening reads
as a single evolving film, while KEEPING the luminance arc (dark -> bright) so it still develops.

Method: per frame, work in CIE-Lab. Leave L (luminance) almost untouched (only a gentle shared
black-lift) so the brightness progression and the intended motion are preserved. Pull the a/b
(colour) channels toward one shared target mean+spread, by a strength factor, so the warm galaxy
and the green vortex move into the same blue family as the brains/Earth without going flat/grey.

This does NOT invent content; it only re-grades existing frames. Strength < 1 keeps each scene's
identity while sharing the family. Usage: python3 grade_opening.py IN.mp4 OUT.mp4 [strength]
"""
import sys, subprocess, os
import cv2, numpy as np

def main(src, out, strength=0.7):
    tmp = out + ".frames"; os.makedirs(tmp, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, os.path.join(tmp, "f_%04d.png")], check=True)
    files = sorted(os.listdir(tmp))
    # Pass 1: target chroma = robust cosmic-blue reference. Use the median of per-frame a/b means
    # over the whole film, then bias toward blue (lower b) so warm/green frames are pulled in, not
    # the blue frames pushed out.
    ab_means = []
    for fn in files:
        im = cv2.imread(os.path.join(tmp, fn))
        lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32)
        ab_means.append((lab[..., 1].mean(), lab[..., 2].mean()))
    ab_means = np.array(ab_means)
    tgt_a = float(np.median(ab_means[:, 0]))
    tgt_b = float(np.median(ab_means[:, 1]))
    # bias toward cool blue: in OpenCV Lab (0..255), 128 is neutral; <128 b = blue. Nudge target blue.
    tgt_b = min(tgt_b, 128.0) - 6.0
    tgt_a = 128.0 + (tgt_a - 128.0) * 0.6   # pull a toward neutral (less magenta/green swing)
    TGT_STD = 11.0                          # shared chroma spread (saturation consistency)
    for fn in files:
        p = os.path.join(tmp, fn)
        lab = cv2.cvtColor(cv2.imread(p), cv2.COLOR_BGR2LAB).astype(np.float32)
        L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
        # protect bright/naturalistic areas (clouds, Earth highlights) from the chroma pull:
        # weight the grade by darkness, so dark cosmic fields are unified but highlights stay real.
        w = strength * np.clip(1.0 - (L / 255.0) ** 1.3, 0.0, 1.0)
        for ch, tgt in ((a, tgt_a), (b, tgt_b)):
            m = ch.mean(); s = ch.std() + 1e-3
            scaled = (ch - m) * (1 + w * (TGT_STD / s - 1)) + m
            ch[...] = scaled + w * (tgt - m)
        # gentle shared black-lift so the darkest joins (e.g. galaxy->brains) do not dip to pure black
        L[...] = 6.0 + L * (255.0 - 6.0) / 255.0
        lab[..., 0] = np.clip(L, 0, 255); lab[..., 1] = np.clip(a, 0, 255); lab[..., 2] = np.clip(b, 0, 255)
        cv2.imwrite(p, cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "24", "-i", os.path.join(tmp, "f_%04d.png"),
                    "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                    "-g", "12", "-keyint_min", "12", "-sc_threshold", "0", "-r", "24", out], check=True)
    print("graded ->", out, "| target a,b =", round(tgt_a, 1), round(tgt_b, 1), "| strength", strength)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 0.7)
