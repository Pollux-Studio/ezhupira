// Country calling codes for phone fields, and a permission-free guess of the visitor's
// country: the computer's time zone first (Asia/Kolkata → India), then the browser's
// language region (ta-IN → India), then India. Nothing is asked of the visitor.

export type PhoneCountry = { iso: string; name: string; dial: string; zones?: string[] };

// India first (most readers), then places with large Tamil communities, then A–Z.
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "IN", name: "India", dial: "91", zones: ["Asia/Kolkata", "Asia/Calcutta"] },
  { iso: "LK", name: "Sri Lanka", dial: "94", zones: ["Asia/Colombo"] },
  { iso: "SG", name: "Singapore", dial: "65", zones: ["Asia/Singapore"] },
  { iso: "MY", name: "Malaysia", dial: "60", zones: ["Asia/Kuala_Lumpur", "Asia/Kuching"] },
  { iso: "AE", name: "United Arab Emirates", dial: "971", zones: ["Asia/Dubai"] },
  { iso: "SA", name: "Saudi Arabia", dial: "966", zones: ["Asia/Riyadh"] },
  { iso: "QA", name: "Qatar", dial: "974", zones: ["Asia/Qatar"] },
  { iso: "KW", name: "Kuwait", dial: "965", zones: ["Asia/Kuwait"] },
  { iso: "OM", name: "Oman", dial: "968", zones: ["Asia/Muscat"] },
  { iso: "BH", name: "Bahrain", dial: "973", zones: ["Asia/Bahrain"] },
  { iso: "GB", name: "United Kingdom", dial: "44", zones: ["Europe/London"] },
  {
    iso: "US",
    name: "United States",
    dial: "1",
    zones: [
      "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix",
      "America/Anchorage", "America/Detroit", "America/Indiana/Indianapolis", "America/Boise", "Pacific/Honolulu",
    ],
  },
  {
    iso: "CA",
    name: "Canada",
    dial: "1",
    zones: ["America/Toronto", "America/Vancouver", "America/Edmonton", "America/Winnipeg", "America/Halifax", "America/St_Johns", "America/Regina"],
  },
  {
    iso: "AU",
    name: "Australia",
    dial: "61",
    zones: ["Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Perth", "Australia/Adelaide", "Australia/Hobart", "Australia/Darwin"],
  },
  { iso: "NZ", name: "New Zealand", dial: "64", zones: ["Pacific/Auckland"] },
  { iso: "MU", name: "Mauritius", dial: "230", zones: ["Indian/Mauritius"] },
  { iso: "RE", name: "Réunion", dial: "262", zones: ["Indian/Reunion"] },
  { iso: "ZA", name: "South Africa", dial: "27", zones: ["Africa/Johannesburg"] },
  { iso: "FR", name: "France", dial: "33", zones: ["Europe/Paris"] },
  { iso: "DE", name: "Germany", dial: "49", zones: ["Europe/Berlin"] },
  { iso: "CH", name: "Switzerland", dial: "41", zones: ["Europe/Zurich"] },
  { iso: "NL", name: "Netherlands", dial: "31", zones: ["Europe/Amsterdam"] },
  { iso: "NO", name: "Norway", dial: "47", zones: ["Europe/Oslo"] },
  { iso: "AF", name: "Afghanistan", dial: "93", zones: ["Asia/Kabul"] },
  { iso: "AR", name: "Argentina", dial: "54", zones: ["America/Argentina/Buenos_Aires"] },
  { iso: "AT", name: "Austria", dial: "43", zones: ["Europe/Vienna"] },
  { iso: "BD", name: "Bangladesh", dial: "880", zones: ["Asia/Dhaka"] },
  { iso: "BE", name: "Belgium", dial: "32", zones: ["Europe/Brussels"] },
  { iso: "BR", name: "Brazil", dial: "55", zones: ["America/Sao_Paulo", "America/Manaus", "America/Fortaleza"] },
  { iso: "BT", name: "Bhutan", dial: "975", zones: ["Asia/Thimphu"] },
  { iso: "CN", name: "China", dial: "86", zones: ["Asia/Shanghai"] },
  { iso: "DK", name: "Denmark", dial: "45", zones: ["Europe/Copenhagen"] },
  { iso: "EG", name: "Egypt", dial: "20", zones: ["Africa/Cairo"] },
  { iso: "ES", name: "Spain", dial: "34", zones: ["Europe/Madrid"] },
  { iso: "FI", name: "Finland", dial: "358", zones: ["Europe/Helsinki"] },
  { iso: "FJ", name: "Fiji", dial: "679", zones: ["Pacific/Fiji"] },
  { iso: "GR", name: "Greece", dial: "30", zones: ["Europe/Athens"] },
  { iso: "HK", name: "Hong Kong", dial: "852", zones: ["Asia/Hong_Kong"] },
  { iso: "ID", name: "Indonesia", dial: "62", zones: ["Asia/Jakarta", "Asia/Makassar"] },
  { iso: "IE", name: "Ireland", dial: "353", zones: ["Europe/Dublin"] },
  { iso: "IL", name: "Israel", dial: "972", zones: ["Asia/Jerusalem"] },
  { iso: "IT", name: "Italy", dial: "39", zones: ["Europe/Rome"] },
  { iso: "JP", name: "Japan", dial: "81", zones: ["Asia/Tokyo"] },
  { iso: "KE", name: "Kenya", dial: "254", zones: ["Africa/Nairobi"] },
  { iso: "KR", name: "South Korea", dial: "82", zones: ["Asia/Seoul"] },
  { iso: "MM", name: "Myanmar", dial: "95", zones: ["Asia/Yangon", "Asia/Rangoon"] },
  { iso: "MV", name: "Maldives", dial: "960", zones: ["Indian/Maldives"] },
  { iso: "MX", name: "Mexico", dial: "52", zones: ["America/Mexico_City"] },
  { iso: "NG", name: "Nigeria", dial: "234", zones: ["Africa/Lagos"] },
  { iso: "NP", name: "Nepal", dial: "977", zones: ["Asia/Kathmandu", "Asia/Katmandu"] },
  { iso: "PH", name: "Philippines", dial: "63", zones: ["Asia/Manila"] },
  { iso: "PK", name: "Pakistan", dial: "92", zones: ["Asia/Karachi"] },
  { iso: "PL", name: "Poland", dial: "48", zones: ["Europe/Warsaw"] },
  { iso: "PT", name: "Portugal", dial: "351", zones: ["Europe/Lisbon"] },
  { iso: "RU", name: "Russia", dial: "7", zones: ["Europe/Moscow"] },
  { iso: "SE", name: "Sweden", dial: "46", zones: ["Europe/Stockholm"] },
  { iso: "SC", name: "Seychelles", dial: "248", zones: ["Indian/Mahe"] },
  { iso: "TH", name: "Thailand", dial: "66", zones: ["Asia/Bangkok"] },
  { iso: "TR", name: "Türkiye", dial: "90", zones: ["Europe/Istanbul"] },
  { iso: "TW", name: "Taiwan", dial: "886", zones: ["Asia/Taipei"] },
  { iso: "TZ", name: "Tanzania", dial: "255", zones: ["Africa/Dar_es_Salaam"] },
  { iso: "VN", name: "Vietnam", dial: "84", zones: ["Asia/Ho_Chi_Minh", "Asia/Saigon"] },
];

export const DEFAULT_COUNTRY = "IN";

export const countryByIso = (iso: string) => PHONE_COUNTRIES.find((c) => c.iso === iso) ?? PHONE_COUNTRIES[0];

/** Best guess of the visitor's country, without asking for location access. Browser only. */
export function detectCountry(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const byZone = PHONE_COUNTRIES.find((c) => c.zones?.includes(zone));
    if (byZone) return byZone.iso;
    for (const lang of navigator.languages ?? [navigator.language]) {
      const region = lang.split("-")[1]?.toUpperCase();
      if (region && PHONE_COUNTRIES.some((c) => c.iso === region)) return region;
    }
  } catch {
    // Fall through to the default.
  }
  return DEFAULT_COUNTRY;
}

/**
 * Splits a stored number into country + national part: "9876543210" (Indian, as Cashfree
 * wants it) → IN; "+447911123456" → GB. `prefer` breaks ties between countries that share a
 * code (US/Canada on +1).
 */
export function parsePhone(value: string | undefined, prefer?: string): { iso: string; national: string } | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (!value.trim().startsWith("+")) return digits ? { iso: "IN", national: digits } : null;
  const matches = PHONE_COUNTRIES.filter((c) => digits.startsWith(c.dial)).sort((a, b) => b.dial.length - a.dial.length);
  if (!matches.length) return null;
  const longest = matches.filter((c) => c.dial.length === matches[0].dial.length);
  const pick = longest.find((c) => c.iso === prefer) ?? longest[0];
  return { iso: pick.iso, national: digits.slice(pick.dial.length) };
}

/** For display: "+91 98765 43210", "+44 7911123456". */
export function formatPhone(value: string) {
  const p = parsePhone(value);
  if (!p) return value;
  const { dial } = countryByIso(p.iso);
  const national = p.iso === "IN" && p.national.length === 10 ? `${p.national.slice(0, 5)} ${p.national.slice(5)}` : p.national;
  return `+${dial} ${national}`;
}
