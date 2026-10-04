import type { MetadataRoute } from "next";
import { PLATFORM_NAME } from "@/lib/brand";
import { MOCK_ONLY } from "@/lib/app-mode";

// Lets phones add the site to the home screen as an app: its own icon, full screen, no browser bars.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: MOCK_ONLY ? "CD IELTS Mock" : PLATFORM_NAME,
    short_name: MOCK_ONLY ? "CD Mock" : PLATFORM_NAME,
    description: MOCK_ONLY ? "Computer-delivered IELTS mock tests at your learning center." : "Lessons, practice questions, mock tests and vocabulary from your learning center.",
    start_url: MOCK_ONLY ? "/mock" : "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#f5f7fb",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
