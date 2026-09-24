import type { Dict } from "./dictionaries";

// Stored values from a fixed list (news tags, deck levels, library types) are saved in English;
// these helpers show them in the reader's language and fall back to the stored text.

function pick<T extends Record<string, string>>(labels: T, value: string): string {
  return value in labels ? labels[value as keyof T] : value;
}

export const newsTag = (t: Dict, tag: string) => pick(t.news.tags, tag);
export const deckLevel = (t: Dict, level: string) => pick(t.vocab.levels, level);
export const libraryCategory = (t: Dict, category: string) => pick(t.library.categories, category);
export const countryName = (t: Dict, country: string) => pick(t.universities.countries, country);
