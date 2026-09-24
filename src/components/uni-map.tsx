"use client";

import dynamic from "next/dynamic";

export type MapUni = { id: string; name: string; city: string; country: string; lat: number; lng: number; satLow: number; satHigh: number };

// Leaflet touches `window`, so the map only renders in the browser.
export const UniMap = dynamic(() => import("./uni-map-inner"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center bg-surface-2 text-sm text-muted">Loading map…</div>,
});
