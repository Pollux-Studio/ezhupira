// Release moment of the next book: 1 January 2027, 8:00 AM India time.
export const RELEASE_AT = new Date("2027-01-01T08:00:00+05:30");
export const RELEASE_LABEL = "1 January 2027 · 8:00 AM IST";

/** "1 January 2027 · 8:00 AM IST" for a release date set in the admin. */
export function releaseLabel(at?: string | Date | null) {
  if (!at) return RELEASE_LABEL;
  const d = new Date(at);
  const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(d);
  const time = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })
    .format(d)
    .toUpperCase();
  return `${day} · ${time} IST`;
}
