import type { Metadata } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
import "@/components/layout/ui.css";
import { SiteChrome } from '@/components/layout/SiteChrome';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { indexableDeployment, siteTitle, siteUrl } from '@/config/site';
import { getSocialPreview } from '@/sanity/socialPreview';

export async function generateMetadata(): Promise<Metadata> {
  const { description, image } = await getSocialPreview();
  return {
    metadataBase: new URL(siteUrl),
    title: siteTitle,
    description,
    alternates: { canonical: '/' },
    robots: { index: indexableDeployment, follow: true },
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION || 'v89BZAkmds9z3IljamW2_lkhPYwhWsVGoYtoe6Y0B-Q' },
    openGraph: { title: "Insignia — Lumikai", description, url: '/', type: "website", locale: "en_IN", siteName: "Lumikai", images: [image] },
    twitter: { card: "summary_large_image", title: "Insignia — Lumikai", description, images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en">
    <head>
      <link rel="preload" href="/fonts/aeonik-regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preload" href="/fonts/aeonik-bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    </head>
    <body><noscript><style>{`.hero-loader{display:none!important}.fullscreen-heading{visibility:visible!important;opacity:1!important}.hero-track{height:100svh!important}.spatial-gallery-track{height:auto!important}.spatial-static{position:static!important;width:auto!important;height:auto!important;clip-path:none!important;overflow:visible!important}`}</style></noscript><SiteChrome />{children}<GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-FBKLWYJ4WZ'} enabled={process.env.NODE_ENV === 'production' && indexableDeployment} /></body>
  </html>;
}
