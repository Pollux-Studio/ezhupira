// Unicode Tamil → the Mallikai font's key code (a Bamini-style legacy layout).
// Port of scripts/to-mallikai.py: Mallikai has no Unicode Tamil glyphs, it draws Tamil on
// ASCII keys, so text shown in that font has to be stored in its key code. Letters that
// aren't in the map make the whole conversion fail (null) instead of guessing; the website
// then shows the plain Unicode text in the normal Tamil font.

const VOWELS: Record<string, string> = {
  அ: "m", ஆ: "M", இ: ",", ஈ: "<", உ: "c", ஊ: "C",
  எ: "v", ஏ: "V", ஐ: "I", ஒ: "x", ஓ: "X", ஔ: "xs", ஃ: "/",
};
const CONSONANTS: Record<string, string> = {
  க: "f", ங: "q", ச: "r", ஞ: "Q", ட: "l", ண: "z", த: "j", ந: "e",
  ப: "g", ம: "k", ய: "a", ர: "u", ல: "y", வ: "t", ழ: "o", ள: "s",
  ற: "w", ன: "d", ஜ: "[", ஷ: "\\", ஸ: "]", ஹ: "`",
};
/** Consonant + ு are single glyphs (uppercase keys in this font). */
const U_SIGN: Record<string, string> = {
  க: "F", ச: "R", ட: "L", ண: "Z", த: "J", ந: "E", ப: "G", ம: "K",
  ய: "A", ர: "U", ல: "Y", வ: "T", ழ: "O", ள: "S", ற: "W", ன: "D",
};
/** Consonant + ூ: own glyph, or the ு glyph plus the "+" tail. All checked in the font. */
const UU_SIGN: Record<string, string> = {
  க: "$", ச: "#", ட: "^", ப: "\xa9", ம: "%", ய: "\xc2", ர: "&", ழ: "*",
  ண: "Z+", த: "J+", ந: "E+", ல: "Y+", வ: "T+", ள: "S+", ற: "W+", ன: "D+",
};
// Grantha letters (and ங ஞ) take separate ு / ூ signs after the consonant.
for (const c of "ஙஞஜஷஸஹ") {
  U_SIGN[c] = CONSONANTS[c] + "{";
  UU_SIGN[c] = CONSONANTS[c] + "_";
}
/** டி and டீ are single glyphs, not ட + the sign. */
const LIGATURE_SIGN: Record<string, string> = { "டி": "b", "டீ": "B" };
const SRI = "ஸ்ரீ"; // one glyph: "="
const KSSA = "க்ஷ"; // one glyph "~", takes vowel signs like a consonant
const AFTER: Record<string, string> = { "ா": "h", "ி": "p", "ீ": "P", "்": ";" };
const BEFORE: Record<string, string> = { "ெ": "n", "ே": "N", "ை": "i" };
const SPLIT: Record<string, [string, string]> = { "ொ": ["n", "h"], "ோ": ["N", "h"], "ௌ": ["n", "s"] };
/** Punctuation that sits on Tamil keys in this font: "," draws இ, so commas use ">". */
const PUNCT: Record<string, string> = { ",": ">" };

const TAMIL = /[஀-௿]/;

/** True when the text contains any Tamil letters. */
export const hasTamil = (text: string) => TAMIL.test(text);

/** Converts Unicode Tamil to Mallikai key code; throws on a letter it can't map. */
export function toMallikai(text: string): string {
  const chars = [...text];
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const rest = chars.slice(i, i + 4).join("");
    if (rest.startsWith(SRI)) {
      out += "=";
      i += [...SRI].length - 1;
      continue;
    }
    let ch = chars[i]!;
    if (rest.startsWith(KSSA)) {
      ch = KSSA; // treat as one consonant
      i += [...KSSA].length - 1;
    }
    const next = chars[i + 1] ?? "";
    if (ch === KSSA || ch in CONSONANTS) {
      const base = ch === KSSA ? "~" : CONSONANTS[ch]!;
      if (ch + next in LIGATURE_SIGN) {
        out += LIGATURE_SIGN[ch + next];
        i++;
      } else if (next === "ு") {
        if (!(ch in U_SIGN)) throw new Error(`no Mallikai glyph for ${ch}ு`);
        out += U_SIGN[ch];
        i++;
      } else if (next === "ூ") {
        if (!(ch in UU_SIGN)) throw new Error(`no Mallikai glyph for ${ch}ூ`);
        out += UU_SIGN[ch];
        i++;
      } else if (next in AFTER) {
        out += base + AFTER[next];
        i++;
      } else if (next in BEFORE) {
        out += BEFORE[next] + base;
        i++;
      } else if (next in SPLIT) {
        const [pre, post] = SPLIT[next]!;
        out += pre + base + post;
        i++;
      } else {
        out += base;
      }
    } else if (ch in VOWELS) {
      out += VOWELS[ch];
    } else if (ch in PUNCT) {
      out += PUNCT[ch];
    } else if (ch === ";") {
      throw new Error("';' has no Mallikai key (it draws the pulli)");
    } else if (ch.charCodeAt(0) < 128 || " \n–—₹".includes(ch)) {
      out += ch;
    } else {
      throw new Error(`cannot convert ${JSON.stringify(ch)}`);
    }
  }
  return out;
}

/** Mallikai key code for Tamil text, or null when it has no Tamil or can't be converted. */
export function mallikaiOrNull(text: string | undefined | null): string | null {
  if (!text || !hasTamil(text)) return null;
  try {
    return toMallikai(text);
  } catch {
    return null;
  }
}
