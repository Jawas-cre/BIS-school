/** A band as shown on reports: "6.5", or "—" when there isn't one yet. */
export function bandText(band: number | null | undefined) {
  return band == null ? "—" : band.toFixed(1);
}
