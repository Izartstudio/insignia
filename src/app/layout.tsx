import type { Metadata } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
import "@/components/layout/ui.css";
import { SiteChrome } from '@/components/layout/SiteChrome';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { indexableDeployment, siteDescription as description, siteTitle, siteUrl } from '@/config/site';
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description,
  alternates: { canonical: '/' },
  robots: { index: indexableDeployment, follow: true },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined },
  openGraph: { title: "Insignia — Lumikai", description, url: '/', type: "website", locale: "en_IN", siteName: "Lumikai", images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Insignia by Lumikai' }] },
  twitter: { card: "summary_large_image", title: "Insignia — Lumikai", description, images: ['/opengraph-image'] },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en">
    <head>
      <link rel="preload" href="/fonts/aeonik-regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preload" href="/fonts/aeonik-bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    </head>
    <body><SiteChrome />{children}<GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-FBKLWYJ4WZ'} enabled={process.env.NODE_ENV === 'production' && indexableDeployment} /></body>
  </html>;
}
