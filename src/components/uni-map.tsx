"use client";

import dynamic from "next/dynamic";
import { useT } from "@/lib/i18n/client";

export type MapUni = { id: string; name: string; city: string; country: string; lat: number; lng: number };

// Leaflet touches `window`, so the map only renders in the browser.
export const UniMap = dynamic(() => import("./uni-map-inner"), {
  ssr: false,
  loading: () => <MapLoading />,
});

function MapLoading() {
  const t = useT();
  return <div className="grid h-full place-items-center bg-surface-2 text-sm text-muted">{t.universities.loadingMap}</div>;
}
