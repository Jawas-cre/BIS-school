import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { PLATFORM_NAME, PLATFORM_TAGLINE } from "@/lib/brand";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${PLATFORM_NAME} — ${PLATFORM_TAGLINE}`, template: `%s · ${PLATFORM_NAME}` },
  description:
    "One learning platform for every learning center and every subject: question bank, timed mock tests, a roadmap of lessons, vocabulary, a library, top universities and an AI tutor.",
};

// Applies the saved (or system) theme before first paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(!t){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} ${jakarta.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
