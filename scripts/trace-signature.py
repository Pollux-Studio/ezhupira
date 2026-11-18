"""Turn the Figma signature outlines into an animated, letter-by-letter signature.

Inputs  (public/):  "Upper lettering.svg" (அன்புடன்) and "Lower lettering and underline.svg"
                    (பிரசாந்த் + underline) — smooth filled outlines exported from Figma.
Output:             lib/signature-paths.ts
                      SIGNATURE_FILL     the outlines, combined into one even-odd path
                      SIGNATURE_STROKES  centre-line pen strokes in signing order, used as an
                                         animated mask that reveals the outlines

Signing order: அன்புடன், then பிரசாந்த், letter by letter (each pulli right after its
letter, ச before ா), and the underline last, left to right.

Usage:  python scripts/trace-signature.py [preview.png]
"""
import heapq
import os
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from figma_shapes import load_shapes, rasterize  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")

SCALE = 6  # raster px per SVG unit
# Where ச ends and ா begins (x, SVG units): ா's line starts after ச's down-stroke.
LETTER_CUTS = [{"x": 196.0, "y0": 45.0, "y1": 115.0}]
LINE_BREAK_Y = 45.0  # letters whose centre is above this belong to அன்புடன்
# Reveal pen width = ink width * PEN_OVERSIZE + PEN_EXTRA (SVG units); shared with the component.
PEN_OVERSIZE = 1.6
PEN_EXTRA = 0.8
N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def neighbours(p, pts):
    return [(p[0] + dy, p[1] + dx) for dy, dx in N8 if (p[0] + dy, p[1] + dx) in pts]


def shortest_path(pts, a, b):
    """Dijkstra along skeleton pixels."""
    dist, prev, heap = {a: 0.0}, {}, [(0.0, a)]
    while heap:
        d, p = heapq.heappop(heap)
        if p == b:
            break
        if d > dist[p]:
            continue
        for q in neighbours(p, pts):
            nd = d + (1.414 if q[0] != p[0] and q[1] != p[1] else 1.0)
            if nd < dist.get(q, 1e18):
                dist[q], prev[q] = nd, p
                heapq.heappush(heap, (nd, q))
    path, p = [b], b
    while p != a:
        p = prev[p]
        path.append(p)
    return path[::-1]


def trace_edges(pts):
    """Split a skeleton into edges between endpoints/junctions (lists of (y, x))."""
    deg = {p: len(neighbours(p, pts)) for p in pts}
    seen = set()
    edges = []

    def walk(start, nxt):
        line, prev, cur = [start, nxt], start, nxt
        seen.add(frozenset((start, nxt)))
        while deg[cur] == 2:
            cand = [q for q in neighbours(cur, pts) if q != prev and frozenset((cur, q)) not in seen]
            if not cand:
                break
            prev, cur = cur, cand[0]
            seen.add(frozenset((prev, cur)))
            line.append(cur)
        return line

    for group in ([p for p in pts if deg[p] == 1], [p for p in pts if deg[p] >= 3], list(pts)):
        for p in sorted(group, key=lambda q: (q[1], q[0])):
            for q in neighbours(p, pts):
                if frozenset((p, q)) not in seen:
                    edges.append(walk(p, q))
    return edges


def _heading(line, at_end, k=12):
    """Unit direction of travel when leaving `line` from its end (at_end) or start."""
    if len(line) < 2:
        return np.zeros(2)
    k = min(k, len(line) - 1)
    v = np.subtract(line[-1], line[-1 - k]) if at_end else np.subtract(line[0], line[k])
    n = np.linalg.norm(v)
    return v / n if n else v


def prune_blob_spurs(edges, gap, limit):
    """Drop short dead-end branches hanging off a junction: they come from ink blobs
    where the pen pressed at the start or end of a stroke, not from real lines."""
    def touches(p, others):
        return any(abs(p[0] - q[0]) <= gap and abs(p[1] - q[1]) <= gap for o in others for q in (o[0], o[-1]))

    kept = []
    for i, e in enumerate(edges):
        others = edges[:i] + edges[i + 1 :]
        a, b = touches(e[0], others), touches(e[-1], others)
        if len(e) < limit and a != b:  # one end hangs free, the other joins the letter
            joint = e[0] if a else e[-1]
            long_here = [o for o in others if len(o) >= limit and touches(joint, [o])]
            # A blob sits in the middle of a through-line (two long lines meet it);
            # a short branch at a corner (e.g. the bar of ா meeting its stem) is real.
            if len(long_here) >= 2:
                continue
        kept.append(e)
    return kept


def pen_strokes(edges, gap, resume_within):
    """Write a letter the way a pen would: one continuous line for as long as the ink
    allows, choosing the straightest way on at each junction, and only lifting the pen
    when every edge at the current point is already written. Starts at the letter's
    top-left free end; after a lift it resumes at the nearest unwritten end."""
    remaining = [e[:] for e in edges if len(e) > 1]
    if not remaining:
        return []

    def ends(e):
        return e[0], e[-1]

    def near(a, b):
        return abs(a[0] - b[0]) <= gap and abs(a[1] - b[1]) <= gap

    def degree(p):
        return sum(1 for e in remaining for q in ends(e) if near(p, q))

    # Where does the pen first touch the paper? Normally the top-left loose end; but if
    # the letter's left side is a closed loop (no loose end there), start at its
    # leftmost point instead, splitting that edge so the pen can begin mid-line.
    xs = [p[1] for e in remaining for p in e]
    x_min, width = min(xs), max(xs) - min(xs) + 1
    free_ends = [q for e in remaining for q in ends(e) if degree(q) == 1]
    first = None
    if not free_ends or min(q[1] for q in free_ends) > x_min + 0.5 * width:
        e = min(remaining, key=lambda e: min(p[1] for p in e))
        i = min(range(len(e)), key=lambda i: (e[i][1], e[i][0]))
        remaining.remove(e)
        left, right = e[: i + 1][::-1], e[i:]
        remaining += [part for part in (left, right) if len(part) > 1]
        # begin on whichever half heads upward (pens start a loop going up and over)
        first = min((part for part in (left, right) if len(part) > 1), key=lambda part: part[-1][0])

    strokes = []
    pen = None
    while remaining:
        if first is not None:
            e, q, first = first, first[0], None
        elif pen is None:
            free = [(e, q) for e in remaining for q in ends(e) if degree(q) == 1] or [
                (e, q) for e in remaining for q in ends(e)
            ]
            e, q = min(free, key=lambda t: t[1][0] + t[1][1])  # top-left first
        else:
            # After a pen lift: carry on right next to the pen if there's unwritten ink there,
            # otherwise start again at the top-left of what's left (loose ends preferred).
            close = [
                (e, q) for e in remaining for q in ends(e)
                if np.hypot(q[0] - pen[0], q[1] - pen[1]) <= resume_within
            ]
            if close:
                e, q = min(close, key=lambda t: np.hypot(t[1][0] - pen[0], t[1][1] - pen[1]))
            else:
                e, q = min(
                    ((e, q) for e in remaining for q in ends(e)),
                    key=lambda t: t[1][0] + t[1][1] + (0 if degree(t[1]) == 1 else 20),
                )
        remaining.remove(e)
        line = e if q == e[0] else e[::-1]
        # Follow the ink until we run out of unwritten edges at the pen's position.
        while True:
            tip, heading = line[-1], _heading(line, True)
            options = []
            for cand in remaining:
                for flip in (False, True):
                    c = cand[::-1] if flip else cand
                    if near(c[0], tip):
                        options.append((float(np.dot(heading, -_heading(c, False))), cand, c))
            if not options:
                break
            _, cand, c = max(options, key=lambda t: t[0])
            remaining.remove(cand)
            line = line + c[1:]
        strokes.append(line)
        pen = line[-1]
    return strokes


def smooth_path(points):
    """Catmull-Rom through points -> cubic Bezier path data."""
    p = [np.array(q, float) for q in points]
    if len(p) == 1:
        return f"M{p[0][0]:.1f} {p[0][1]:.1f}l0.1 0"
    d = [f"M{p[0][0]:.1f} {p[0][1]:.1f}"]
    for i in range(len(p) - 1):
        p0 = p[i - 1] if i > 0 else p[i]
        p1, p2 = p[i], p[i + 1]
        p3 = p[i + 2] if i + 2 < len(p) else p2
        c1, c2 = p1 + (p2 - p0) / 6, p2 - (p3 - p1) / 6
        d.append(f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}")
    return "".join(d)




def to_units(stroke, origin):
    """(y, x) raster px -> (x, y) SVG units."""
    ox, oy = origin
    return [(ox + x / SCALE, oy + y / SCALE) for y, x in stroke]


def stroke_path(stroke, origin):
    if len(stroke) == 1:
        pts = to_units(stroke, origin)
        return {"d": smooth_path(pts), "len": 0.5}, pts
    arr = np.array([[q[1], q[0]] for q in stroke], np.float32).reshape(-1, 1, 2)
    simp = cv2.approxPolyDP(arr, 0.35 * SCALE, False).reshape(-1, 2)
    pts = to_units([(y, x) for x, y in simp], origin)
    length = sum(float(np.hypot(b[0] - a[0], b[1] - a[1])) for a, b in zip(pts, pts[1:]))
    return {"d": smooth_path(pts), "len": round(max(length, 0.5), 1)}, pts


preview_out = sys.argv[1] if len(sys.argv) > 1 else None
root = __file__.replace("\\", "/").rsplit("/scripts/", 1)[0]
shapes = load_shapes(root)
mask, origin = rasterize(shapes, SCALE)
ox, oy = origin
H, W = mask.shape
dt = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
skel = cv2.ximgproc.thinning(mask, thinningType=cv2.ximgproc.THINNING_GUOHALL)


def ink_width(pixels):
    """Full ink thickness (SVG units) along a set of skeleton pixels."""
    vals = [dt[p] for p in pixels]
    return 2 * float(np.percentile(vals, 90)) / SCALE if vals else 1.0


# Dots (pulli): small separate blobs. Their skeleton is replaced by a single point.
n, labels, stats, cents = cv2.connectedComponentsWithStats(mask, 8)
dots = []
for i in range(1, n):
    w, h = stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT]
    if max(w, h) <= 9 * SCALE:
        cy, cx = int(cents[i][1]), int(cents[i][0])
        dots.append({"p": (cy, cx), "w": max(w, h) / SCALE})
        skel[labels == i] = 0

pts = set(zip(*np.nonzero(skel)))

# Underline: the skeleton route from its bottom-left end to the far-right end.
ends = [p for p in pts if len(neighbours(p, pts)) == 1]
left = min((p for p in ends if p[0] > H * 0.85), key=lambda p: p[1])
right = max(ends, key=lambda p: p[1])
underline = shortest_path(pts, left, right)
pts -= set(underline)

# Split letters that are joined in the ink (ச | ா).
for cut in LETTER_CUTS:
    cx = int((cut["x"] - ox) * SCALE)
    y0, y1 = int((cut["y0"] - oy) * SCALE), int((cut["y1"] - oy) * SCALE)
    pts = {p for p in pts if not (abs(p[1] - cx) <= 1 and y0 <= p[0] <= y1)}

# Letters = connected pieces of what's left.
img = np.zeros_like(mask)
for p in pts:
    img[p] = 255
n, labels, stats, cents = cv2.connectedComponentsWithStats(img, 8)
letters = []
for i in range(1, n):
    cpts = set(zip(*np.nonzero(labels == i)))
    thick_px = ink_width(cpts) * SCALE
    if len(cpts) < thick_px * 1.5:
        continue  # stub left where a letter touched the underline or a cut
    edges = [e for e in trace_edges(cpts) if len(e) > thick_px * 1.2 or len(cpts) < thick_px * 4]
    gap = max(3, int(thick_px * 0.7))
    all_edges = edges
    edges = prune_blob_spurs(edges, gap, limit=thick_px * 3.2)
    # The blob spurs aren't pen movements, but the pen still has to pass over them so the
    # whole ink is revealed: add each as a short dab, drawn outward from where it joins.
    kept_ids = {id(e) for e in edges}
    dabs = []
    for e in all_edges:
        if id(e) in kept_ids:
            continue
        joins_at_end = any(abs(e[-1][0] - q[0]) <= gap and abs(e[-1][1] - q[1]) <= gap for k in edges for q in (k[0], k[-1]))
        dabs.append(e[::-1] if joins_at_end else e)
    x0, y0 = stats[i, cv2.CC_STAT_LEFT], stats[i, cv2.CC_STAT_TOP]
    x1, y1 = x0 + stats[i, cv2.CC_STAT_WIDTH], y0 + stats[i, cv2.CC_STAT_HEIGHT]
    letters.append({
        "box": (x0, y0, x1, y1),
        "line": 0 if oy + cents[i][1] / SCALE < LINE_BREAK_Y else 1,
        "w": ink_width(cpts),
        "strokes": pen_strokes(edges, gap, resume_within=thick_px * 2.5) + dabs,
        "dots": [],
    })
letters.sort(key=lambda L: (L["line"], L["box"][0]))


def box_distance(p, box):
    y, x = p
    x0, y0, x1, y1 = box
    dx = max(x0 - x, 0, x - x1)
    dy = max(y0 - y, 0, y - y1)
    return float(np.hypot(dx, dy))


def dot_cost(dot, L):
    # A pulli sits on or above its letter — never below it.
    below = dot["p"][0] > L["box"][3]
    return box_distance(dot["p"], L["box"]) + (1e6 if below else 0)


for dot in dots:
    min(letters, key=lambda L: dot_cost(dot, L))["dots"].append(dot)

strokes = []
preview = []
for li, L in enumerate(letters):
    for s in L["strokes"]:
        path, ppts = stroke_path(s, origin)
        strokes.append({**path, "w": round(L["w"], 2), "letter": li})
        preview.append(ppts)
    for dot in L["dots"]:
        path, ppts = stroke_path([dot["p"]], origin)
        strokes.append({**path, "w": round(dot["w"], 2), "letter": li})
        preview.append(ppts)
path, ppts = stroke_path(underline, origin)
strokes.append({**path, "w": round(ink_width(underline), 2), "letter": len(letters)})
preview.append(ppts)


# Coverage check: draw every pen stroke at its final width and find ink it misses
# (blobs wider than the stroke, e.g. the top of ா). Patch each spot with a dab.
def sample_units(ppts):
    out = []
    for a_, b_ in zip(ppts, ppts[1:] or ppts):
        for t in np.linspace(0, 1, 6):
            out.append((a_[0] + (b_[0] - a_[0]) * t, a_[1] + (b_[1] - a_[1]) * t))
    return out


pen = np.zeros_like(mask)
for st, ppts in zip(strokes, preview):
    width_px = max(1, int((st["w"] * PEN_OVERSIZE + PEN_EXTRA) * SCALE))
    q = [(int((x - ox) * SCALE), int((y - oy) * SCALE)) for x, y in sample_units(ppts)]
    for a_, b_ in zip(q, q[1:] or q):
        cv2.line(pen, a_, b_, 255, width_px)
    for end in (q[0], q[-1]):
        cv2.circle(pen, end, width_px // 2, 255, -1)
missing = ((mask > 0) & (pen == 0)).astype(np.uint8)
n, labels, stats, cents = cv2.connectedComponentsWithStats(missing, 8)
patched = 0
for i in range(1, n):
    if stats[i, cv2.CC_STAT_AREA] < 4 * SCALE:
        continue  # anti-aliasing crumbs
    cy, cx = int(cents[i][1]), int(cents[i][0])
    diameter = np.hypot(stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT]) / SCALE
    owner = min(range(len(letters)), key=lambda k: box_distance((cy, cx), letters[k]["box"]))
    if (cy, cx) in set(underline) or box_distance((cy, cx), letters[owner]["box"]) > 3 * SCALE:
        owner = len(letters)  # it belongs to the underline
    dab_w = round((diameter * 1.15 - PEN_EXTRA) / PEN_OVERSIZE, 2)
    path, ppts = stroke_path([(cy, cx)], origin)
    last = max(j for j, st in enumerate(strokes) if st["letter"] <= owner)
    strokes.insert(last + 1, {**path, "w": max(dab_w, 0.5), "letter": owner})
    preview.insert(last + 1, ppts)
    patched += 1
print("coverage patches:", patched)

print("letters:", len(letters), "strokes:", len(strokes))

# Combined outline path for the visible ink.
fill_d = "".join(s["d"] for s in shapes)
all_pts = np.vstack([s["pts"] for s in shapes])
(vx0, vy0), (vx1, vy1) = all_pts.min(axis=0) - 2, all_pts.max(axis=0) + 2
viewbox = f"{vx0:.1f} {vy0:.1f} {vx1 - vx0:.1f} {vy1 - vy0:.1f}"

out = [
    "// Generated by scripts/trace-signature.py from the Figma outlines in public/",
    '// ("Upper lettering.svg" + "Lower lettering and underline.svg"). Re-run the script',
    "// instead of editing by hand.",
    "",
    "/** One pen movement: centre-line path, its length, ink width, and which letter it belongs to. */",
    "export type SignatureStroke = { d: string; len: number; w: number; letter: number };",
    "",
    f'export const SIGNATURE_VIEWBOX = "{viewbox}";',
    "",
    "/** Reveal pen width = stroke.w * SIGNATURE_PEN.oversize + SIGNATURE_PEN.extra (SVG units). */",
    f"export const SIGNATURE_PEN = {{ oversize: {PEN_OVERSIZE}, extra: {PEN_EXTRA} }};",
    "",
    "/** The signature's ink as smooth outlines (even-odd fill). */",
    f'export const SIGNATURE_FILL =\n  "{fill_d}";',
    "",
    "/** Pen strokes in signing order: letter by letter, pulli after its letter, underline last. */",
    "export const SIGNATURE_STROKES: SignatureStroke[] = [",
]
out += [f'  {{ d: "{s["d"]}", len: {s["len"]}, w: {s["w"]}, letter: {s["letter"]} }},' for s in strokes]
out.append("];")
open(f"{root}/lib/signature-paths.ts", "w", encoding="utf-8").write("\n".join(out) + "\n")

if preview_out:
    S = 4
    img = np.full((int((vy1 - vy0) * S), int((vx1 - vx0) * S), 3), 255, np.uint8)
    ink = cv2.resize(mask, None, fx=S / SCALE, fy=S / SCALE)
    X0, Y0 = int((ox - vx0) * S), int((oy - vy0) * S)
    reg = img[Y0 : Y0 + ink.shape[0], X0 : X0 + ink.shape[1]]
    reg[ink[: reg.shape[0], : reg.shape[1]] > 0] = (225, 225, 225)
    colors = [(57, 28, 213), (200, 120, 0), (0, 150, 0), (150, 0, 150)]
    for i, ppts in enumerate(preview):
        c = colors[i % 4]
        q = [(int((x - vx0) * S), int((y - vy0) * S)) for x, y in ppts]
        for a, b in zip(q, q[1:]):
            cv2.line(img, a, b, c, 2)
        cv2.circle(img, q[0], 6, c, -1)
        if len(q) > 1:
            v = np.subtract(q[1], q[0]).astype(float)
            v = v / (np.linalg.norm(v) or 1) * 18
            cv2.arrowedLine(img, q[0], (int(q[0][0] + v[0]), int(q[0][1] + v[1])), c, 2, tipLength=0.6)
        cv2.putText(img, str(i + 1), (q[0][0] + 6, q[0][1] - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    cv2.imwrite(preview_out, img)
