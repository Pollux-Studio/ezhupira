"""Render the images used in emails into public/email/ (served from the website).

  python scripts/render-email-assets.py

- signature.gif: Prasanth's signature writing itself, from the same data as the website's
  preloader (lib/signature-paths.ts): the filled ink shape, revealed by pen strokes in
  signing order. It plays once and stays on the finished signature. (Email clients don't
  run CSS or JS animation, but Gmail, Apple Mail and Outlook on the web play GIFs.) Outlook
  for Windows shows only the first frame, so the first frame already has a faint trace of
  the whole signature.
- signature.png: the finished signature, for anywhere a still image is better.
- logo.png: the square logo (from public/icon-512.png), since Gmail doesn't show SVG.

Re-run after changing the signature or the logo.
"""

import math
import re
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "email"

INK = (0xD5, 0x1C, 0x39)  # Ezhupira red, as on the site
PAPER = (0xFF, 0xFF, 0xFF)  # the email card behind it
GHOST = 0.13  # strength of the faint trace shown before the pen reaches it

OUT_WIDTH = 720  # shown at 360px in the email, so sharp on 2x screens
SUPERSAMPLE = 3  # draw bigger, then shrink, for smooth edges
DRAW_SECONDS = 1.6  # same pacing idea as the site (components/animated-signature.tsx)
LIFT_SECONDS = 0.015
LETTER_PAUSE_SECONDS = 0.05
FRAME_MS = 40


# ------------------------------------------------------------------ data ---

src = (ROOT / "lib" / "signature-paths.ts").read_text(encoding="utf-8")
VIEWBOX = [float(v) for v in re.search(r'SIGNATURE_VIEWBOX = "([^"]+)"', src).group(1).split()]
PEN = re.search(r"SIGNATURE_PEN = \{ oversize: ([\d.]+), extra: ([\d.]+) \}", src)
OVERSIZE, EXTRA = float(PEN.group(1)), float(PEN.group(2))
FILL = re.search(r"SIGNATURE_FILL =\s*\"([^\"]+)\"", src).group(1)
STROKES = [
    {"d": d, "len": float(length), "w": float(w), "letter": int(letter)}
    for d, length, w, letter in re.findall(r'\{ d: "([^"]+)", len: ([\d.]+), w: ([\d.]+), letter: (\d+) \}', src)
]
assert STROKES, "no strokes parsed from lib/signature-paths.ts"


# ------------------------------------------------------------- geometry ---

def parse_path(d):
    """Subpaths as lists of points, flattening curves. Handles M L l H C Z (all the data uses)."""
    tokens = re.findall(r"[MLlHCZz]|-?\d*\.?\d+(?:e-?\d+)?", d)
    subpaths, cur, x, y, i, cmd = [], [], 0.0, 0.0, 0, None

    def num():
        nonlocal i
        i += 1
        return float(tokens[i - 1])

    while i < len(tokens):
        if re.match(r"[A-Za-z]", tokens[i]):
            cmd = tokens[i]
            i += 1
            if cmd in "Zz":
                if cur:
                    subpaths.append(cur)
                cur = []
                continue
        if cmd == "M":
            if cur:
                subpaths.append(cur)
            x, y = num(), num()
            cur = [(x, y)]
            cmd = "L"  # further pairs after M are line-tos
        elif cmd == "L":
            x, y = num(), num()
            cur.append((x, y))
        elif cmd == "l":
            x, y = x + num(), y + num()
            cur.append((x, y))
        elif cmd == "H":
            x = num()
            cur.append((x, y))
        elif cmd == "C":
            x1, y1, x2, y2, x3, y3 = (num() for _ in range(6))
            x0, y0 = x, y
            steps = max(4, int(math.dist((x0, y0), (x3, y3)) / 1.5))
            for s in range(1, steps + 1):
                t = s / steps
                mt = 1 - t
                cur.append((
                    mt**3 * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t**3 * x3,
                    mt**3 * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t**3 * y3,
                ))
            x, y = x3, y3
        else:
            raise ValueError(f"unsupported path command {cmd}")
    if cur:
        subpaths.append(cur)
    return subpaths


W = OUT_WIDTH * SUPERSAMPLE
SCALE = W / VIEWBOX[2]
H = round(VIEWBOX[3] * SCALE)


def to_px(p):
    return ((p[0] - VIEWBOX[0]) * SCALE, (p[1] - VIEWBOX[1]) * SCALE)


def fill_mask():
    """The ink shape, filled even-odd (each subpath toggles coverage)."""
    mask = Image.new("1", (W, H), 0)
    for sub in parse_path(FILL):
        layer = Image.new("1", (W, H), 0)
        ImageDraw.Draw(layer).polygon([to_px(p) for p in sub], fill=1)
        mask = ImageChops.logical_xor(mask, layer)
    return mask.convert("L")


def pen_line(draw, pts, width):
    """A round-capped, round-jointed pen line through the points."""
    if not pts:
        return
    r = width / 2
    if len(pts) > 1:
        draw.line(pts, fill=255, width=max(1, round(width)), joint="curve")
    for p in (pts[0], pts[-1]):
        draw.ellipse((p[0] - r, p[1] - r, p[0] + r, p[1] + r), fill=255)


def partial(pts, fraction):
    """The first `fraction` of a polyline by length."""
    if fraction >= 1 or len(pts) < 2:
        return pts
    seg = [math.dist(a, b) for a, b in zip(pts, pts[1:])]
    target, out, run = sum(seg) * fraction, [pts[0]], 0.0
    for (a, b), s in zip(zip(pts, pts[1:]), seg):
        if run + s >= target:
            k = (target - run) / s if s else 0
            out.append((a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k))
            return out
        out.append(b)
        run += s
    return out


def ease_in_out(t):
    return t * t * (3 - 2 * t)


# ------------------------------------------------------------- timeline ---

total_len = sum(s["len"] for s in STROKES)
cursor, timeline = 0.0, []
for i, s in enumerate(STROKES):
    if i:
        cursor += LIFT_SECONDS if STROKES[i - 1]["letter"] == s["letter"] else LETTER_PAUSE_SECONDS
    duration = max(0.04, s["len"] / total_len * DRAW_SECONDS)
    pts = [to_px(p) for sub in parse_path(s["d"]) for p in sub]
    timeline.append({"start": cursor, "end": cursor + duration, "pts": pts, "width": (s["w"] * OVERSIZE + EXTRA) * SCALE})
    cursor += duration
END = cursor


# --------------------------------------------------------------- render ---

ink = fill_mask()


def frame(revealed):
    """Paper, a faint trace of the whole signature, and the ink revealed so far."""
    shown = ImageChops.multiply(ink, revealed)
    ghost = ink.point(lambda v: round(v * GHOST))
    alpha = ImageChops.lighter(shown, ghost)
    img = Image.composite(Image.new("RGB", (W, H), INK), Image.new("RGB", (W, H), PAPER), alpha)
    return img.resize((OUT_WIDTH, round(H / SUPERSAMPLE)), Image.LANCZOS)


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    frames, done = [], Image.new("L", (W, H), 0)  # `done` holds finished strokes
    finished = 0
    t = 0.0
    while t <= END + 1e-9:
        while finished < len(timeline) and timeline[finished]["end"] <= t:
            pen_line(ImageDraw.Draw(done), timeline[finished]["pts"], timeline[finished]["width"])
            finished += 1
        revealed = done.copy()
        for s in timeline[finished:]:
            if s["start"] < t < s["end"]:
                k = ease_in_out((t - s["start"]) / (s["end"] - s["start"]))
                pen_line(ImageDraw.Draw(revealed), partial(s["pts"], k), s["width"])
        frames.append(frame(revealed))
        t += FRAME_MS / 1000
    full = Image.new("L", (W, H), 255)
    final = frame(full)
    frames.append(final)

    # One shared palette (from the finished signature) so frames don't flicker.
    palette = final.quantize(colors=48, method=Image.Quantize.MEDIANCUT)
    gif_frames = [f.quantize(palette=palette, dither=Image.Dither.NONE) for f in frames]
    durations = [FRAME_MS] * (len(gif_frames) - 1) + [5000]
    # No `loop` given: no looping block is written, so it plays once and rests on the last frame.
    gif_frames[0].save(OUT / "signature.gif", save_all=True, append_images=gif_frames[1:], duration=durations, disposal=1, optimize=False)
    final.save(OUT / "signature.png", optimize=True)

    Image.open(ROOT / "public" / "icon-512.png").convert("RGB").resize((96, 96), Image.LANCZOS).save(OUT / "logo.png", optimize=True)

    for name in ("signature.gif", "signature.png", "logo.png"):
        print(f"{name}: {(OUT / name).stat().st_size // 1024} KB")
    print(f"{len(gif_frames)} frames, {END:.2f}s of writing, {OUT_WIDTH}x{final.height}px")


if __name__ == "__main__":
    main()
