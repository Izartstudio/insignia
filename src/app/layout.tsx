import type { Metadata } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
import "@/components/layout/ui.css";
import { SiteChrome } from '@/components/layout/SiteChrome';
const description = "Insignia by Lumikai brings together leaders, founders, industry experts and investors for India’s signature interactive media event and annual LP summit.";
export const metadata: Metadata = {
  title: "Insignia — Interactive Media & Gaming Summit | Lumikai",
  description,
  openGraph: { title: "Insignia — Lumikai", description, type: "website", locale: "en_IN", siteName: "Lumikai" },
  twitter: { card: "summary", title: "Insignia — Lumikai", description },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en">
    <head>
      <link rel="preload" href="/fonts/aeonik-regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preload" href="/fonts/aeonik-bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    </head>
    <body><SiteChrome />{children}</body>
  </html>;
}
