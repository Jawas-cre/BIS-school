// Wrong PINs per account (or per unknown login) in the last 15 minutes: PINs are short, so guessing
// is cut off after 10, whether the candidate number or the phone number is typed. A new PIN from
// the center lifts the block.

const failures = new Map<string, number[]>();
const WINDOW_MS = 15 * 60_000;
const LIMIT = 10;

function recent(key: string) {
  const list = (failures.get(key) ?? []).filter((t) => Date.now() - t < WINDOW_MS);
  if (list.length) failures.set(key, list);
  else failures.delete(key);
  return list;
}

export function pinBlocked(key: string) {
  return recent(key).length >= LIMIT;
}

export function pinFailed(key: string) {
  failures.set(key, [...recent(key), Date.now()]);
}

export function clearPinFailures(key: string) {
  failures.delete(key);
}
