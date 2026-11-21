"""Convert Unicode Tamil to the Mallikai font's key code (a Bamini-style legacy layout).

Mallikai has no Unicode Tamil glyphs; it draws Tamil on ASCII keys. Text shown in that
font has to be typed in its key code, so convert it here, then check the preview image.

Usage:
    python scripts/to-mallikai.py "நான் யார்?" [preview.png]

The key map was read off the font itself (public/fonts/mallikai-regular.ttf). Letters
not in the map raise an error instead of guessing.
"""
import sys

sys.stdout.reconfigure(encoding="utf-8")

VOWELS = {
    "அ": "m", "ஆ": "M", "இ": ",", "ஈ": "<", "உ": "c", "ஊ": "C",
    "எ": "v", "ஏ": "V", "ஐ": "I", "ஒ": "x", "ஓ": "X", "ஔ": "xs", "ஃ": "/",
}
CONSONANTS = {
    "க": "f", "ங": "q", "ச": "r", "ஞ": "Q", "ட": "l", "ண": "z", "த": "j", "ந": "e",
    "ப": "g", "ம": "k", "ய": "a", "ர": "u", "ல": "y", "வ": "t", "ழ": "o", "ள": "s",
    "ற": "w", "ன": "d", "ஜ": "[", "ஷ": "\\", "ஸ": "]", "ஹ": "`",
}
# Consonant + ு are single glyphs (uppercase keys in this font).
U_SIGN = {
    "க": "F", "ச": "R", "ட": "L", "ண": "Z", "த": "J", "ந": "E", "ப": "G", "ம": "K",
    "ய": "A", "ர": "U", "ல": "Y", "வ": "T", "ழ": "O", "ள": "S", "ற": "W", "ன": "D",
}
# Consonant + ூ: own glyph, or the ு glyph plus the "+" tail. All checked in the font.
UU_SIGN = {
    "க": "$", "ச": "#", "ட": "^", "ப": "\xa9", "ம": "%", "ய": "\xc2", "ர": "&", "ழ": "*",
    "ண": "Z+", "த": "J+", "ந": "E+", "ல": "Y+", "வ": "T+", "ள": "S+", "ற": "W+", "ன": "D+",
}
# Grantha letters (and ங ஞ) take separate ு / ூ signs after the consonant.
for _c in "ஙஞஜஷஸஹ":
    U_SIGN[_c] = CONSONANTS[_c] + "{"
    UU_SIGN[_c] = CONSONANTS[_c] + "_"
# டி and டீ are single glyphs, not ட + the sign.
LIGATURE_SIGN = {("ட", "ி"): "b", ("ட", "ீ"): "B"}
SRI = "ஸ்ரீ"         # one glyph: "="
KSSA = "க்ஷ"         # one glyph "~", takes vowel signs like a consonant
AFTER = {"ா": "h", "ி": "p", "ீ": "P", "்": ";"}       # signs drawn after the consonant
BEFORE = {"ெ": "n", "ே": "N", "ை": "i"}                # signs drawn before it
SPLIT = {"ொ": ("n", "h"), "ோ": ("N", "h"), "ௌ": ("n", "s")}  # before + after
# Punctuation that sits on Tamil keys in this font: "," draws இ and ";" draws the pulli.
PUNCT = {",": ">"}
PASS = set(" \n.!?-–—:()0123456789₹/")


def to_mallikai(text: str) -> str:
    out = []
    i = 0
    while i < len(text):
        if text.startswith(SRI, i):
            out.append("="); i += len(SRI); continue
        ch = text[i]
        if text.startswith(KSSA, i):
            ch, i = KSSA, i + len(KSSA) - 1  # treat as one consonant
        nxt = text[i + 1] if i + 1 < len(text) else ""
        if ch == KSSA or ch in CONSONANTS:
            base = "~" if ch == KSSA else CONSONANTS[ch]
            if (ch, nxt) in LIGATURE_SIGN:
                out.append(LIGATURE_SIGN[(ch, nxt)]); i += 2; continue
            if nxt == "ு":
                if ch not in U_SIGN:
                    raise ValueError(f"no Mallikai glyph for {ch}ு")
                out.append(U_SIGN[ch]); i += 2; continue
            if nxt == "ூ":
                if ch not in UU_SIGN:
                    raise ValueError(f"no Mallikai glyph for {ch}ூ")
                out.append(UU_SIGN[ch]); i += 2; continue
            if nxt in AFTER:
                out.append(base + AFTER[nxt]); i += 2; continue
            if nxt in BEFORE:
                out.append(BEFORE[nxt] + base); i += 2; continue
            if nxt in SPLIT:
                pre, post = SPLIT[nxt]
                out.append(pre + base + post); i += 2; continue
            out.append(base); i += 1; continue
        if ch in VOWELS:
            out.append(VOWELS[ch]); i += 1; continue
        if ch == "'":
            out.append("'"); i += 1; continue
        if ch in PUNCT:
            out.append(PUNCT[ch]); i += 1; continue
        if ch == ";":
            raise ValueError("';' has no Mallikai key (it draws the pulli)")
        if ch in PASS or ch.isascii():
            out.append(ch); i += 1; continue
        raise ValueError(f"cannot convert {ch!r} (U+{ord(ch):04X})")
    return "".join(out)


if __name__ == "__main__":
    src = sys.argv[1]
    key = to_mallikai(src)
    print(key)
    if len(sys.argv) > 2:
        from PIL import Image, ImageDraw, ImageFont

        font = ImageFont.truetype("public/fonts/mallikai-regular.ttf", 44)
        ref = ImageFont.truetype("C:/Windows/Fonts/Nirmala.ttc", 36)
        w = 60 + int(font.getlength(key))
        img = Image.new("RGB", (max(w, 1200), 140), "white")
        d = ImageDraw.Draw(img)
        d.text((10, 10), src, font=ref, fill="gray")
        d.text((10, 70), key, font=font, fill="black")
        img.save(sys.argv[2])
