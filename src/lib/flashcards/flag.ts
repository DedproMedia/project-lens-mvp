// Converts an ISO 3166-1 alpha-2 code (e.g. "FR") into the matching
// flag emoji by mapping each letter onto a Unicode regional indicator symbol.
export function flagEmoji(isoCode: string): string {
  return isoCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}
