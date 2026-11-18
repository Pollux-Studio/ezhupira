// About the author, in Tamil and English.
// Tamil is shown in the JF Devadas font, a legacy font that draws Tamil on Latin-1 codes,
// so each paragraph has its Unicode text (for screen readers and search) and the font's
// code. Regenerate the code with: python scripts/to-devadas.py "<Tamil text>"

export type AuthorParagraph = { unicode: string; devadas: string };

export const AUTHOR_BIO_TA: AuthorParagraph[] = [
  {
    unicode: "கண்ணுக்குத் தெரியும் உலகத்தை விட, மனதுக்குள் ஓடும் உலகம் மிகவும் பெரியது. அந்த உள்ளத்து உலகை, என் எழுத்துக்களின் வழியே மொழிபெயர்க்க முயற்சிக்கிறேன்.",
    devadas: "Li\u00d4d\u00cfj \u00f9R\u00ac\u00d9m EXLj\u00fbR \u00aeP, U]\u00d5d\u00cfs K\u00d3m EXLm \u00aaL\u00dcm \u00f9T\u00acV\u00d5. AkR Es[j\u00d5 EX\u00fbL, Gu G\u00ddj\u00d5dL\u00b0u Y\u00af\u00faV \u00f9U\u00f4\u00af\u00f9TVodL \u00d8Vt\u00a3d\u00a1\u00fa\\u.",
  },
  {
    unicode: "என் ஒவ்வொரு பதிவிலும் நான் காணும் சமூகத்தின் மீதான பார்வையும், மனித உணர்வுகளின் ஆழமும் நிறைந்திருக்கும். ஒரு வாசகர் என் எழுத்தைக் கடந்து செல்கையில், அது ஏதோ ஒரு வகையில் அவரைத் தொட்டு, ஒரு புதிய சிந்தனையைத் தூண்ட வேண்டும் என்பதே என் தேடல்.",
    devadas: "Gu Jq\u00f9Y\u00f4\u00da T\u00a7\u00ae\u00dbm S\u00f4u L\u00f4\u00d4m N\u00eaLj\u00a7u \u00c1R\u00f4] T\u00f4o\u00fbY\u00d9m, U\u00b2R EQo\u00dcL\u00b0u BZ\u00d8m \u00a8\u00fb\\k\u00a7\u00dad\u00cfm. J\u00da Y\u00f4NLo Gu G\u00ddj\u00fbRd LPk\u00d5 \u00f9Np\u00fbL\u00abp, A\u00d5 H\u00faR\u00f4 J\u00da Y\u00fbL\u00abp AY\u00fbWj \u00f9R\u00f4h\u00d3, J\u00da \u00d7\u00a7V \u00a3kR\u00fb]\u00fbVj \u00e7iP \u00faYi\u00d3m GuT\u00faR Gu \u00faRPp.",
  },
  {
    unicode: "வாழ்க்கை எப்படிப் பல வண்ணங்களைக் கொண்டதோ, அதே போலத்தான் எழுத்தும்.",
    devadas: "Y\u00f4rd\u00fbL GlT\u00a5l TX YiQeL\u00fb[d \u00f9L\u00f4iP\u00faR\u00f4, A\u00faR \u00faT\u00f4XjR\u00f4u G\u00ddj\u00d5m.",
  },
];

export const AUTHOR_BIO_EN: string[] = [
  "The world that runs within the mind is far greater than the world we see with our eyes. Through my writing, I try to translate that inner world into words.",
  "Each of my posts reflects my perspective on the society I observe and the depth of human emotions. My pursuit is to ensure that as a reader comes across my writing, it touches them in some way and inspires a new thought.",
  "Just as life is filled with many colours, so is writing.",
];
