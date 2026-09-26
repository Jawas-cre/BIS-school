"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from "react-leaflet";
import type { MapUni } from "./uni-map";
import { useT } from "@/lib/i18n/client";
import { countryName } from "@/lib/i18n/labels";

export default function UniMapInner({
  universities,
  targetId,
  center = [32, 10],
  zoom = 2,
}: {
  universities: MapUni[];
  targetId?: string | null;
  center?: [number, number];
  zoom?: number;
}) {
  const t = useT();
  return (
    <MapContainer center={center} zoom={zoom} minZoom={2} scrollWheelZoom={false} worldCopyJump className="size-full" style={{ background: "var(--surface-2)" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {universities.map((u) => {
        const target = u.id === targetId;
        return (
          <CircleMarker
            key={u.id}
            center={[u.lat, u.lng]}
            radius={target ? 10 : 7}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: target ? "#eb6834" : "#2a78d6", fillOpacity: 1 }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              {u.name}
            </Tooltip>
            <Popup>
              <div className="min-w-44 font-sans">
                <div className="font-bold">{u.name}</div>
                <div className="text-xs opacity-70">
                  {u.city}, {countryName(t, u.country)}
                </div>
                <Link href={`/universities/${u.id}`} className="mt-1 inline-block text-xs font-semibold">
                  {t.universities.viewDetails}
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
