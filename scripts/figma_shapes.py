"""Load the Figma-exported signature outlines into one coordinate system.

Shared by scripts/trace-signature.py. Coordinates are the lower frame's units:
the upper frame (அன்புடன்) sits at UPPER_OFFSET inside it.
"""
import re

import cv2
import numpy as np

UPPER_SVG = "public/Upper lettering.svg"
LOWER_SVG = "public/Lower lettering and underline.svg"
# Found by matching a shape that appears uncut in both frames: the inner hole of the
# அ loop (upper subpath 3 == lower subpath 2).
UPPER_OFFSET = (86.0, -28.775)
TINY_HOLE = 6.0  # units: holes smaller than this are ink blobs (e.g. the end of ா)


def _subpaths(svg_text):
    d = re.search(r'<path d="([^"]+)"', svg_text).group(1)
    return re.findall(r"M[^M]*", d)


def _tokens(d):
    return re.findall(r"[MLHVCZmlhvcz]|-?\d*\.?\d+(?:e-?\d+)?", d)


def polyline(d, offset=(0.0, 0.0), steps=12):
    """Flatten an absolute M/L/H/V/C/Z subpath into points (offset applied)."""
    t = _tokens(d)
    pts, cur, cmd, i = [], np.zeros(2), None, 0
    while i < len(t):
        if t[i].isalpha():
            cmd = t[i]
            i += 1
            if cmd in "Zz":
                continue
        if cmd == "M" or cmd == "L":
            cur = np.array([float(t[i]), float(t[i + 1])])
            pts.append(cur)
            i += 2
        elif cmd == "H":
            cur = np.array([float(t[i]), cur[1]])
            pts.append(cur)
            i += 1
        elif cmd == "V":
            cur = np.array([cur[0], float(t[i])])
            pts.append(cur)
            i += 1
        elif cmd == "C":
            p1, p2, p3 = (np.array([float(t[i + k]), float(t[i + k + 1])]) for k in (0, 2, 4))
            for s in np.linspace(0, 1, steps)[1:]:
                pts.append((1 - s) ** 3 * cur + 3 * (1 - s) ** 2 * s * p1 + 3 * (1 - s) * s * s * p2 + s**3 * p3)
            cur = p3
            i += 6
        else:
            raise ValueError(f"unsupported path command {cmd}")
    return np.array(pts) + np.array(offset)


def translate_d(d, dx, dy):
    """Shift an absolute subpath's coordinates (used to place the upper frame)."""
    t = _tokens(d)
    out, cmd, i = [], None, 0
    while i < len(t):
        if t[i].isalpha():
            cmd = t[i]
            out.append(cmd)
            i += 1
            continue
        if cmd in "MLC":
            out += [f"{float(t[i]) + dx:.3f}", f"{float(t[i + 1]) + dy:.3f}"]
            i += 2
        elif cmd == "H":
            out.append(f"{float(t[i]) + dx:.3f}")
            i += 1
        elif cmd == "V":
            out.append(f"{float(t[i]) + dy:.3f}")
            i += 1
    return " ".join(out).replace(" Z", "Z")


def load_shapes(root="."):
    upper = _subpaths(open(f"{root}/{UPPER_SVG}", encoding="utf-8").read())
    lower = _subpaths(open(f"{root}/{LOWER_SVG}", encoding="utf-8").read())
    dx, dy = UPPER_OFFSET

    shapes = [{"d": translate_d(s, dx, dy), "pts": polyline(s, (dx, dy)), "frame": "upper"} for s in upper]

    # Lower-frame pieces cut off at its top edge are copies of the upper lettering —
    # skip them, except where they continue a stroke the upper frame cuts at its bottom.
    upper_cut = [p for p in shapes if p["pts"][:, 1].max() >= 70.8 + dy]
    upper_boxes = [np.r_[p["pts"].min(axis=0), p["pts"].max(axis=0)] for p in shapes]
    for s in lower:
        pts = polyline(s)
        box = np.r_[pts.min(axis=0), pts.max(axis=0)]
        if any(np.abs(box - ub).max() < 1.5 for ub in upper_boxes):
            continue  # an uncut copy of an upper shape (e.g. the அ loop's hole)
        if pts[:, 1].min() <= 0.5:
            x0, x1 = pts[:, 0].min(), pts[:, 0].max()
            if not any(c["pts"][:, 0].min() <= x1 and x0 <= c["pts"][:, 0].max() and pts[:, 1].max() > 70.8 + dy for c in upper_cut):
                continue
        shapes.append({"d": s, "pts": pts, "frame": "lower"})

    # Drop tiny holes (an outline whose centre sits inside another shape's ink).
    kept = []
    for i, s in enumerate(shapes):
        w = np.ptp(s["pts"][:, 0])
        h = np.ptp(s["pts"][:, 1])
        if max(w, h) < TINY_HOLE:
            c = tuple(map(float, s["pts"].mean(axis=0)))
            inside = sum(
                cv2.pointPolygonTest(o["pts"].astype(np.float32), c, False) > 0
                for j, o in enumerate(shapes) if j != i
            )
            if inside % 2 == 1:
                continue
        kept.append(s)
    return kept


def rasterize(shapes, scale, pad=4):
    """Even-odd fill of all shapes into a binary mask; returns mask and the origin used."""
    allpts = np.vstack([s["pts"] for s in shapes])
    x0, y0 = allpts.min(axis=0) - pad
    x1, y1 = allpts.max(axis=0) + pad
    w, h = int((x1 - x0) * scale) + 1, int((y1 - y0) * scale) + 1
    mask = np.zeros((h, w), np.uint8)
    # Even-odd like the SVG's fill-rule: XOR each outline in (a hole cancels its letter).
    for s in shapes:
        layer = np.zeros_like(mask)
        poly = ((s["pts"] - [x0, y0]) * scale).round().astype(np.int32)
        cv2.fillPoly(layer, [poly], 255, lineType=cv2.LINE_8)
        mask ^= layer
    return mask, (x0, y0)
