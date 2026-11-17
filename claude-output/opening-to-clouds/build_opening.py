#!/usr/bin/env python3
"""Assemble the opening-to-clouds preview from existing, hash-verified clips per edl.json.

Straight cuts only -- NO fades, iris, blink or dust overlays. The task forbids hiding joins,
so a hard cut is the honest choice; join quality is reported separately, not papered over.

Usage: python3 build_opening.py SRC_DIR OUT_DIR
SRC_DIR must contain the 7 source clips named exactly as in edl.json, each verified against its
SHA256 before use. Nothing outside OUT_DIR is written; no source is modified.
"""
import json, os, subprocess, sys, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1280, 720, 24

def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()

def main(src_dir, out_dir):
    edl = json.load(open(os.path.join(HERE, "edl.json")))
    os.makedirs(out_dir, exist_ok=True)
    seg_dir = os.path.join(out_dir, "_segments"); os.makedirs(seg_dir, exist_ok=True)
    concat_list = os.path.join(seg_dir, "concat.txt")
    lines = []
    for i, s in enumerate(edl["segments"]):
        src = os.path.join(src_dir, s["clip"])
        got = sha256(src)
        if got != s["sha256"]:
            raise SystemExit(f"SHA256 mismatch for {s['clip']}: expected {s['sha256']}, got {got}")
        seg = os.path.join(seg_dir, f"seg_{i:02d}_{s['scene'].replace(' ','_').replace('(','').replace(')','').replace('/','-')}.mp4")
        # trim by TIME (preserves wall-clock duration regardless of source fps), then resample to 24 fps
        t_in = s["in"] / s["src_fps"]
        dur = (s["out"] - s["in"]) / s["src_fps"]
        vf = (f"fps={FPS},scale={W}:{H}:force_original_aspect_ratio=decrease,"
              f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=black,setpts=PTS-STARTPTS")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t_in:.5f}", "-t", f"{dur:.5f}",
                        "-i", src, "-vf", vf, "-an",
                        "-c:v", "libx264", "-crf", "16", "-preset", "slow",
                        "-pix_fmt", "yuv420p", seg], check=True)
        lines.append(f"file '{os.path.basename(seg)}'")
        print(f"seg {i}: {s['scene']:28s} frames [{s['in']},{s['out']}) = {dur:.2f}s")
    open(concat_list, "w").write("\n".join(lines) + "\n")
    out = os.path.join(out_dir, "opening-to-clouds-preview.mp4")
    # re-encode on concat so the GOP structure is uniform for seeking
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", concat_list,
                    "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p",
                    "-g", "12", "-keyint_min", "12", "-sc_threshold", "0", "-r", str(FPS), out], check=True)
    print("WROTE", out)
    return out

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
