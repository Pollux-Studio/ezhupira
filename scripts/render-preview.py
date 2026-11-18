"""Render a book's preview pages for the flipbook.

Only the first PREVIEW_PAGES pages of the PDF are turned into images; the rest of the
book never leaves this machine. The full PDF lives in content/books/ (NOT public/, which
the site serves to anyone) and is git-ignored.

Output: public/previews/<slug>/  00-cover.webp, 01.webp … NN.webp, end.webp
        (each 900×1440, i.e. 2× a 450×720 page, with a faint "PREVIEW" watermark)

Usage (needs:  pip install pymupdf pillow):
    python scripts/render-preview.py naan-yaar
"""
import os
import sys

import pymupdf
from PIL import Image, ImageDraw, ImageFont

SLUG = sys.argv[1] if len(sys.argv) > 1 else "naan-yaar"
PREVIEW_PAGES = 10
SRC_PDF = f"content/books/{SLUG}.pdf"
COVER = "public/Frame 6.jpg"
OUT = f"public/previews/{SLUG}"
W, H = 900, 1440  # 5:8, 2× display size
FONT = "C:/Windows/Fonts/segoeui.ttf"
FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
MALLIKAI = "public/fonts/mallikai-regular.ttf"  # Tamil typed in its key code (scripts/to-mallikai.py)
RED, INK, MUTED, LINE = (213, 28, 57), (20, 17, 18), (120, 120, 120), (232, 232, 232)

# Text for the end-of-preview page.
BOOKS = {
    "naan-yaar": {
        "title_mallikai": "ehd; ahu;?",  # நான் யார்?
        "author_mallikai": "gpurhe;j;.n[",  # பிரசாந்த்.ஜெ
        "price": "Paperback · ₹118 + shipping",
    },
}


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()


def watermark(img):
    """Faint diagonal 'PREVIEW · EZHUPIRA' tiled across the page."""
    layer = Image.new("RGBA", (W * 2, H * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    f = font(FONT_BOLD, 34)
    text = "PREVIEW · EZHUPIRA"
    for y in range(0, H * 2, 220):
        for x in range(-200 if (y // 220) % 2 else 0, W * 2, 520):
            d.text((x, y), text, font=f, fill=(213, 28, 57, 22))
    layer = layer.rotate(32, resample=Image.BICUBIC).crop((W // 2, H // 2, W // 2 + W, H // 2 + H))
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


def footer(img, label):
    d = ImageDraw.Draw(img)
    f = font(FONT, 24)
    tw = d.textlength(label, font=f)
    d.text(((W - tw) / 2, H - 56), label, font=f, fill=(150, 150, 150))
    return img


def centered(d, y, text, fnt, fill):
    w = d.textlength(text, font=fnt)
    d.text(((W - w) / 2, y), text, font=fnt, fill=fill)


def end_page(total_pages):
    """A neat closing page. The band at 74–87% of the height is left empty: the site puts
    a real, clickable buy button there (see components/book/book-flipbook.tsx)."""
    meta = BOOKS.get(SLUG, {})
    img = Image.new("RGB", (W, H), (255, 255, 255))
    d = ImageDraw.Draw(img)

    # thin red frame, like a printed page ornament
    d.rounded_rectangle((44, 44, W - 44, H - 44), radius=18, outline=RED, width=3)

    # small padlock + label
    cx, top = W // 2, 150
    d.rounded_rectangle((cx - 26, top + 20, cx + 26, top + 66), radius=8, fill=RED)
    d.arc((cx - 17, top - 6, cx + 17, top + 40), start=180, end=360, fill=RED, width=7)
    label = "E N D   O F   P R E V I E W"
    centered(d, top + 96, label, font(FONT_BOLD, 26), RED)

    # title + author (Mallikai)
    if meta.get("title_mallikai"):
        centered(d, 330, meta["title_mallikai"], font(MALLIKAI, 124), INK)
    if meta.get("author_mallikai"):
        centered(d, 500, meta["author_mallikai"], font(MALLIKAI, 52), MUTED)

    d.line((cx - 40, 610, cx + 40, 610), fill=RED, width=4)

    # progress
    read = PREVIEW_PAGES
    centered(d, 660, f"You've read {read} of {total_pages} pages", font(FONT_BOLD, 38), INK)
    bx0, bx1, by = 170, W - 170, 735
    d.rounded_rectangle((bx0, by, bx1, by + 16), radius=8, fill=LINE)
    d.rounded_rectangle((bx0, by, bx0 + (bx1 - bx0) * read / total_pages, by + 16), radius=8, fill=RED)
    centered(d, 790, f"{total_pages - read} more pages are waiting for you.", font(FONT, 32), MUTED)

    if meta.get("price"):
        centered(d, 960, meta["price"], font(FONT, 32), INK)

    # brand at the foot
    centered(d, 1300, "vOgpu", font(MALLIKAI, 44), RED)  # எழுபிர
    return img


def save(img, name):
    img.save(f"{OUT}/{name}", "WEBP", quality=82, method=6)


os.makedirs(OUT, exist_ok=True)
for old in os.listdir(OUT):
    os.remove(os.path.join(OUT, old))

cover = Image.open(COVER).convert("RGB").resize((W, H), Image.LANCZOS)
save(cover, "00-cover.webp")

doc = pymupdf.open(SRC_PDF)
for i in range(min(PREVIEW_PAGES, doc.page_count)):
    page = doc[i]
    zoom = W / page.rect.width
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples).resize((W, H), Image.LANCZOS)
    img = footer(watermark(img), f"Preview · page {i + 1} of {PREVIEW_PAGES}")
    save(img, f"{i + 1:02d}.webp")

save(end_page(doc.page_count), "end.webp")
print(f"wrote {len(os.listdir(OUT))} files to {OUT} (book has {doc.page_count} pages)")
