#!/usr/bin/env python3
"""
cut-bg.py — give the supplied artwork a real alpha channel.

The ChatGPT-exported PNGs ship with NO transparency: their "transparent" look
is a light grey checkerboard baked into the pixels, which shows up as an ugly
box behind each image in the UI.

This removes it: a pixel counts as background if it's light AND neutral
(r≈g≈b, the checker's two near-white tones), and we only erase the background
region that is connected to the image border. White/cream areas *inside* a
subject (the medallion centre, the card's cream rim, the white teapot in the
players scene) are enclosed by the subject, so the flood never reaches them and
they are preserved. A 1px erosion + slight alpha blur removes the anti-alias
fringe.

Usage:
    python3 -m venv .venv && ./.venv/bin/pip install pillow numpy scipy
    ./.venv/bin/python scripts/cut-bg.py            # processes public/assets/*.png in place

Re-run after dropping a freshly exported (flat) image into public/assets/.
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

FILES = [
    "logo", "hero-board", "table-felt", "card-back",
    "landscape", "players", "medallion", "teapot",
]

LIGHT = 234   # min channel value to be considered "light"
NEUTRAL = 12  # max allowed (max-min) channel spread to be considered "grey"


def cutout(path: str) -> float:
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.int16)
    mn, mx = a.min(axis=2), a.max(axis=2)
    bg_like = (mn >= LIGHT) & ((mx - mn) <= NEUTRAL)

    lbl, _ = ndimage.label(bg_like)
    border = (set(lbl[0, :]) | set(lbl[-1, :])
              | set(lbl[:, 0]) | set(lbl[:, -1]))
    border.discard(0)
    bg = np.isin(lbl, list(border))

    opaque = ndimage.binary_erosion(~bg, iterations=1)
    alpha = np.where(opaque, 255.0, 0.0)
    alpha = ndimage.gaussian_filter(alpha, sigma=0.8)
    alpha = np.clip(alpha, 0, 255).astype(np.uint8)

    out = np.dstack([np.asarray(im), alpha])
    Image.fromarray(out, "RGBA").save(path)
    return 100 * (alpha < 8).mean()


def main():
    base = "public/assets"
    names = sys.argv[1:] or FILES
    for n in names:
        p = f"{base}/{n}.png"
        pct = cutout(p)
        print(f"{n:12} transparent={pct:4.1f}%")


if __name__ == "__main__":
    main()
