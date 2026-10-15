import type { Metadata } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
import "@/components/layout/ui.css";
import { Navbar } from "@/components/layout/Navbar";
import { SmoothScrolling } from "@/components/layout/SmoothScrolling";
export const metadata: Metadata = { title: "INSIGNIA — Lumikai", description: "A cinematic experience by Lumikai." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en">
    <head>
      <link rel="preload" href="/fonts/aeonik-regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preload" href="/fonts/aeonik-bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    </head>
    <body><SmoothScrolling /><Navbar />{children}</body>
  </html>;
}
