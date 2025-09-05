#!/usr/bin/env python3
import os, sys, math, argparse, glob
from pathlib import Path
import numpy as np
from PIL import Image

#  ***********************
#   RUN
#   python interpolate_total_frames.py --glob "beer*.png" --total-frames 120 --fps 24 --upscale 2 --out-dir frames_120 --gif out_120.gif
#  *****


# Optional deps
try:
    import cv2
    HAS_CV2 = True
except Exception:
    HAS_CV2 = False

def log(s): print(s, flush=True)

# ---------- Image helpers ----------
def pil_to_cv(img_pil):
    arr = np.array(img_pil.convert("RGB"))
    return arr[:, :, ::-1].copy()  # RGB->BGR

def cv_to_pil(img_cv):
    arr = img_cv[:, :, ::-1]  # BGR->RGB
    return Image.fromarray(np.clip(arr,0,255).astype(np.uint8))

def upscale(img: Image.Image, factor: int) -> Image.Image:
    if factor <= 1:
        return img
    resampling = getattr(Image, "Resampling", Image)
    return img.resize((img.width*factor, img.height*factor), resampling.LANCZOS)

def crossfade(a: Image.Image, b: Image.Image, t: float) -> Image.Image:
    if a.mode != b.mode:
        b = b.convert(a.mode)
    return Image.blend(a, b, t)

def read_images(paths, upscale_factor=1, force_mode="RGBA", chroma_bg=None):
    """Load images and optionally composite over chroma background."""
    out = []
    first_size = None
    for p in paths:
        im = Image.open(p).convert(force_mode)
        if chroma_bg is not None and force_mode == "RGBA":
            bg = Image.new("RGBA", im.size, chroma_bg + (255,))
            im = Image.alpha_composite(bg, im)
        if first_size is None:
            first_size = im.size
        else:
            # match sizes to first
            im = im.resize(first_size, getattr(Image, "Resampling", Image).LANCZOS)
        im = upscale(im, upscale_factor)
        out.append(im)
    return out

# ---------- Optical-flow preparation + one-step interpolation ----------
def prepare_flows(keyframes):
    """Precompute A->B and B->A flows for each pair. Returns lists (flowAB, flowBA)."""
    flows_ab, flows_ba = [], []
    if not HAS_CV2:
        return None, None
    for i in range(len(keyframes)-1):
        A = pil_to_cv(keyframes[i])
        B = pil_to_cv(keyframes[i+1])
        Ag = cv2.cvtColor(A, cv2.COLOR_BGR2GRAY)
        Bg = cv2.cvtColor(B, cv2.COLOR_BGR2GRAY)
        flowAB = cv2.calcOpticalFlowFarneback(
            Ag, Bg, None, pyr_scale=0.5, levels=4, winsize=19,
            iterations=4, poly_n=5, poly_sigma=1.2, flags=0
        )
        flowBA = cv2.calcOpticalFlowFarneback(
            Bg, Ag, None, pyr_scale=0.5, levels=4, winsize=19,
            iterations=4, poly_n=5, poly_sigma=1.2, flags=0
        )
        flows_ab.append(flowAB)
        flows_ba.append(flowBA)
    return flows_ab, flows_ba

def prepare_flows_loop(keyframes):
    """Same, but include last->first for looping."""
    if not HAS_CV2: return None, None
    flows_ab, flows_ba = [], []
    K = len(keyframes)
    for i in range(K):
        A = pil_to_cv(keyframes[i])
        B = pil_to_cv(keyframes[(i+1) % K])
        Ag = cv2.cvtColor(A, cv2.COLOR_BGR2GRAY)
        Bg = cv2.cvtColor(B, cv2.COLOR_BGR2GRAY)
        flowAB = cv2.calcOpticalFlowFarneback(
            Ag, Bg, None, pyr_scale=0.5, levels=4, winsize=19,
            iterations=4, poly_n=5, poly_sigma=1.2, flags=0
        )
        flowBA = cv2.calcOpticalFlowFarneback(
            Bg, Ag, None, pyr_scale=0.5, levels=4, winsize=19,
            iterations=4, poly_n=5, poly_sigma=1.2, flags=0
        )
        flows_ab.append(flowAB)
        flows_ba.append(flowBA)
    return flows_ab, flows_ba

def interpolate_one_cv(A_img, B_img, flowAB, flowBA, t):
    """One interpolation step (0..1) using precomputed flows."""
    A = pil_to_cv(A_img)
    B = pil_to_cv(B_img)
    h, w = flowAB.shape[:2]
    gridX, gridY = np.meshgrid(np.arange(w), np.arange(h))
    mapAx = (gridX + flowAB[...,0]*t).astype(np.float32)
    mapAy = (gridY + flowAB[...,1]*t).astype(np.float32)
    warpA = cv2.remap(A, mapAx, mapAy, interpolation=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT101)

    s = 1.0 - t
    mapBx = (gridX + flowBA[...,0]*s).astype(np.float32)
    mapBy = (gridY + flowBA[...,1]*s).astype(np.float32)
    warpB = cv2.remap(B, mapBx, mapBy, interpolation=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT101)

    inter = (warpA*(1-t) + warpB*t).astype(np.uint8)
    return cv_to_pil(inter)

# ---------- Timeline sampling ----------
def sample_frames_uniform(keyframes, total_frames, loop=False, flows_ab=None, flows_ba=None):
    """
    Sample exact number of frames uniformly across the whole timeline.
    - Non-loop: segments = K-1, t_global in [0,1], inclusive of both ends.
    - Loop:     segments = K,   t_global in [0,1), last frame equals first (seamless).
    """
    K = len(keyframes)
    if K < 2:
        raise ValueError("Need at least 2 keyframes")

    frames = []
    segments = K if loop else (K - 1)

    for s in range(total_frames):
        if loop:
            # [0,1) so last frame is not a duplicate; use modulo pairing
            u = s / total_frames  # 0 <= u < 1
        else:
            # include end exactly
            u = s / (total_frames - 1) if total_frames > 1 else 0.0  # 0..1

        t_scaled = u * segments  # which segment + local t
        seg_idx = int(np.floor(t_scaled)) % segments
        t_local = t_scaled - np.floor(t_scaled)

        iA = seg_idx
        iB = (seg_idx + 1) % K

        A = keyframes[iA]
        B = keyframes[iB]

        if t_local <= 1e-8:
            # exactly on a keyframe
            frames.append(A.copy())
            continue

        if HAS_CV2 and flows_ab is not None and flows_ba is not None:
            # choose the right flow arrays
            flowAtoB = flows_ab[seg_idx]
            flowBtoA = flows_ba[seg_idx]
            frames.append(interpolate_one_cv(A, B, flowAtoB, flowBtoA, float(t_local)))
        else:
            # fallback: crossfade
            frames.append(crossfade(A, B, float(t_local)))

    # For non-loop, the last sample equals last keyframe (already included).
    return frames

# ---------- Saving ----------
def save_frames_png(frames, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    for idx, fr in enumerate(frames):
        fr.save(out_dir / f"frame_{idx:04d}.png", optimize=True)

def save_gif(frames, gif_path, fps):
    dur_ms = int(1000/max(1,fps))
    try:
        frames[0].save(
            gif_path, save_all=True, append_images=frames[1:],
            loop=0, duration=dur_ms, disposal=2
        )
    except Exception:
        f2 = [f.convert("P", palette=Image.ADAPTIVE, colors=256) for f in frames]
        f2[0].save(
            gif_path, save_all=True, append_images=f2[1:],
            loop=0, duration=dur_ms, disposal=2
        )

# ---------- CLI ----------
def main():
    ap = argparse.ArgumentParser(description="Interpolate to an exact total number of frames (uniform timeline sampling).")
    ap.add_argument("--inputs", nargs="+", help="Explicit list of image paths (ordered).")
    ap.add_argument("--glob", default=None, help="Glob pattern (e.g., 'beer*.png'). Used if --inputs not given.")
    ap.add_argument("--total-frames", type=int, required=True, help="Exact number of frames to output.")
    ap.add_argument("--fps", type=int, default=24, help="GIF fps.")
    ap.add_argument("--upscale", type=int, default=1, help="Integer upscale factor.")
    ap.add_argument("--loop", action="store_true", help="Seamless loop across last->first.")
    ap.add_argument("--out-dir", default="frames_total", help="Directory to save PNG frames.")
    ap.add_argument("--gif", default="interpolated_total.gif", help="Output GIF path.")
    ap.add_argument("--mode", choices=["RGB","RGBA"], default="RGBA", help="Working image mode.")
    ap.add_argument("--chroma-green", action="store_true", help="Composite over chroma green for keying.")
    args = ap.parse_args()

    # Resolve inputs
    if args.inputs:
        paths = [Path(p) for p in args.inputs]
    elif args.glob:
        paths = [Path(p) for p in sorted(glob.glob(args.glob))]
    else:
        paths = [Path(f"beer{i}.png") for i in range(1,8)]

    if len(paths) < 2:
        log("ERROR: Need at least two input images.")
        sys.exit(1)
    for p in paths:
        if not p.exists():
            log(f"ERROR: Missing input: {p}")
            sys.exit(1)
    if args.total_frames < 2:
        log("ERROR: --total-frames must be >= 2")
        sys.exit(1)

    chroma_bg = (0,255,0) if args.chroma_green else None

    log(f"Loading {len(paths)} images...")
    keyframes = read_images(paths, upscale_factor=args.upscale, force_mode=args.mode, chroma_bg=chroma_bg)

    # Prepare flows
    if HAS_CV2:
        log(f"Preparing optical flows ({'loop' if args.loop else 'non-loop'})...")
        if args.loop:
            flows_ab, flows_ba = prepare_flows_loop(keyframes)
        else:
            flows_ab, flows_ba = prepare_flows(keyframes)
    else:
        flows_ab = flows_ba = None
        log("OpenCV not found; will use crossfade blending.")

    # Sample timeline
    log(f"Sampling {args.total_frames} frames uniformly across {len(keyframes)} keyframes...")
    frames = sample_frames_uniform(keyframes, args.total_frames, loop=args.loop, flows_ab=flows_ab, flows_ba=flows_ba)

    # Save
    out_dir = Path(args.out_dir)
    log(f"Saving frames to: {out_dir}")
    save_frames_png(frames, out_dir)

    gif_path = Path(args.gif)
    log(f"Writing GIF: {gif_path}")
    save_gif(frames, gif_path, args.fps)

    log(f"Done. total_frames={len(frames)}")

if __name__ == "__main__":
    main()
