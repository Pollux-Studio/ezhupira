"""Convert Unicode Tamil to the JF Devadas font's key code.

JF Devadas (public/fonts/1759773631_JFDevadasNormal.ttf) is a legacy font: it has no
Unicode Tamil, it draws Tamil on ASCII/Latin-1 codes. Text shown in it has to be typed in
that code, so convert it here, then check the preview image.

Usage:
    python scripts/to-devadas.py "கண்ணுக்குத் தெரியும்" [preview.png]

The map was read off the font's own glyph chart. Letters not in the map raise an error
instead of guessing. (Unrelated to Mallikai's layout — see scripts/to-mallikai.py.)
"""
import sys

sys.stdout.reconfigure(encoding="utf-8")

VOWELS = {
    "அ": "A", "ஆ": "B", "இ": "C", "ஈ": "D", "உ": "E", "ஊ": "F",
    "எ": "G", "ஏ": "H", "ஐ": "I", "ஒ": "J", "ஓ": "K", "ஃ": "@",
}
CONSONANTS = {
    "க": "L", "ங": "M", "ச": "N", "ஞ": "O", "ட": "P", "ண": "Q", "த": "R", "ந": "S",
    "ப": "T", "ம": "U", "ய": "V", "ர": "W", "ல": "X", "வ": "Y", "ழ": "Z", "ள": "[",
    "ற": "\\", "ன": "]", "ஸ": "^", "ஜ": "_", "ஷ": "`", "ஹ": "a",
}
PULLI = {  # consonant + ்
    "க": "d", "ங": "e", "ச": "f", "ஞ": "g", "ட": "h", "ண": "i", "த": "j", "ந": "k",
    "ப": "l", "ம": "m", "ய": "n", "ர": "o", "ல": "p", "வ": "q", "ழ": "r", "ள": "s",
    "ற": "t", "ன": "u", "ஸ": "v", "ஜ": "w", "ஷ": "x", "ஹ": "y",
}
I_SIGN = {  # consonant + ி
    "க": "\xa1", "ச": "\xa3", "ட": "\xa5", "ண": "\xa6", "த": "\xa7", "ந": "\xa8",
    "ப": "\xa9", "ம": "\xaa", "ய": "\xab", "ர": "\xac", "ல": "\xad", "வ": "\xae",
    "ழ": "\xaf", "ள": "\xb0", "ற": "\xb1", "ன": "\xb2", "ஸ": "\xb3", "ஜ": "\xb4",
    "ஷ": "\xb5", "ஹ": "\xb6",
}
II_SIGN = {  # consonant + ீ
    "க": "\xb8", "ச": "\xba", "ட": "\xbc", "ண": "\xbd", "த": "\xbe", "ந": "\xbf",
    "ப": "\xc0", "ம": "\xc1", "ய": "\xc2", "ர": "\xc3", "ல": "\xc4", "வ": "\xc5",
    "ழ": "\xc6", "ள": "\xc7", "ற": "\xc8", "ன": "\xc9", "ஸ": "\xca", "ஜ": "\xcb",
    "ஷ": "\xcc", "ஹ": "\xcd",
}
U_SIGN = {  # consonant + ு
    "க": "\xcf", "ச": "\xd1", "ட": "\xd3", "ண": "\xd4", "த": "\xd5", "ந": "\xd6",
    "ப": "\xd7", "ம": "\xd8", "ய": "\xd9", "ர": "\xda", "ல": "\xdb", "வ": "\xdc",
    "ழ": "\xdd", "ள": "\xde", "ற": "\xdf", "ன": "\xe0",
}
UU_SIGN = {  # consonant + ூ
    "க": "\xe1", "ச": "\xe3", "ட": "\xe5", "ண": "\xe6", "த": "\xe7", "ந": "\xe8",
    "ப": "\xe9", "ம": "\xea", "ய": "\xeb", "ர": "\xec", "ல": "\xed", "வ": "\xee",
    "ழ": "\xef", "ள": "\xf0", "ற": "\xf1", "ன": "\xf2",
}
AA, E, EE, AI, AU = "\xf4", "\xf9", "\xfa", "\xfb", "\xfc"  # ா ெ ே ை ௗ
PASS = set(" ,.!?:-()0123456789\n")


def convert(text: str) -> str:
    out, i = [], 0
    while i < len(text):
        ch, nxt = text[i], text[i + 1] if i + 1 < len(text) else ""
        if ch in CONSONANTS:
            c = CONSONANTS[ch]
            table = {"்": PULLI, "ி": I_SIGN, "ீ": II_SIGN, "ு": U_SIGN, "ூ": UU_SIGN}.get(nxt)
            if table is not None:
                if ch not in table:
                    raise ValueError(f"no glyph for {ch}{nxt}")
                out.append(table[ch])
            elif nxt == "ா":
                out.append(c + AA)
            elif nxt == "ெ":
                out.append(E + c)
            elif nxt == "ே":
                out.append(EE + c)
            elif nxt == "ை":
                out.append(AI + c)
            elif nxt == "ொ":
                out.append(E + c + AA)
            elif nxt == "ோ":
                out.append(EE + c + AA)
            elif nxt == "ௌ":
                out.append(E + c + AU)
            else:
                out.append(c)
                i += 1
                continue
            i += 2
        elif ch in VOWELS:
            out.append(VOWELS[ch])
            i += 1
        elif ch in PASS:
            out.append(ch)
            i += 1
        else:
            raise ValueError(f"unmapped character {ch!r} (U+{ord(ch):04X})")
    return "".join(out)


if __name__ == "__main__":
    src = sys.argv[1]
    code = convert(src)
    print(code.encode("unicode_escape").decode("ascii"))
    if len(sys.argv) > 2:
        from PIL import Image, ImageDraw, ImageFont

        lines = src.split("\n")
        img = Image.new("RGB", (1500, 110 * len(lines) + 20), "white")
        d = ImageDraw.Draw(img)
        f = ImageFont.truetype("public/fonts/1759773631_JFDevadasNormal.ttf", 34, encoding="symb")
        n = ImageFont.truetype("C:/Windows/Fonts/Nirmala.ttc", 26)
        for k, line in enumerate(lines):
            d.text((10, 10 + 110 * k), line, font=n, fill=(120, 120, 120))
            d.text((10, 50 + 110 * k), convert(line), font=f, fill="black")
        img.save(sys.argv[2])
