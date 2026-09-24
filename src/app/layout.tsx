import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { PLATFORM_NAME } from "@/lib/brand";
import { I18nProvider } from "@/lib/i18n/client";
import { getI18n } from "@/lib/i18n/server";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: `${PLATFORM_NAME} — ${t.landing.tagline}`, template: `%s · ${PLATFORM_NAME}` },
    description: t.landing.metaDescription,
  };
}

// Applies the saved color mode before first paint. Without a saved choice it follows the
// device, and keeps following it when the device switches between light and dark.
const themeScript = `(function(){var d=document.documentElement,m=matchMedia("(prefers-color-scheme: dark)");function a(){var t=null;try{t=localStorage.getItem("theme")}catch(e){}if(t!=="light"&&t!=="dark")t=m.matches?"dark":"light";d.dataset.theme=t}a();m.addEventListener("change",function(){document.startViewTransition&&!matchMedia("(prefers-reduced-motion: reduce)").matches?document.startViewTransition(a):a()});addEventListener("storage",function(e){if(e.key==="theme")a()})})()`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale } = await getI18n();
  return (
    <html
      lang={locale}
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} ${jakarta.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
