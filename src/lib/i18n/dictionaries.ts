import type { Locale } from "./config";
import * as common from "./messages/common";
import * as landing from "./messages/landing";
import * as auth from "./messages/auth";
import * as student from "./messages/student";
import * as admin from "./messages/admin";

const namespaces = { ...common, ...landing, ...auth, ...student, ...admin };

type Namespaces = typeof namespaces;
export type Dict = { [K in keyof Namespaces]: Namespaces[K]["en"] };

function build(locale: Locale): Dict {
  return Object.fromEntries(Object.entries(namespaces).map(([key, ns]) => [key, ns[locale]])) as Dict;
}

export const DICTIONARIES: Record<Locale, Dict> = { en: build("en"), uz: build("uz") };
