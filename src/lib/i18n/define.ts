/**
 * Declares one namespace of UI text in both languages. The English object defines the keys;
 * the Uzbek object must have exactly the same keys, so a missing translation fails the build.
 *
 * Strings may contain `{name}` placeholders (filled with `fmt`) and plural pairs
 * `{ one, other }` (picked with `plural`).
 */
export function defineMessages<T extends object>(messages: { en: T; uz: NoInfer<T> }) {
  return messages;
}
