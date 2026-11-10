import type { Metadata, Viewport } from "next";
import { site } from "@/config/storefront";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: site.name, title: `${site.name} — ${site.tagline}`, description: site.description, images: ["/media/hero-poster.jpg"] },
  twitter: { card: "summary_large_image", title: site.name, description: site.description, images: ["/media/hero-poster.jpg"] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#03060b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Poster is the LCP element — fetch it first. */}
        <link rel="preload" as="image" href="/media/hero-poster.jpg" fetchPriority="high" />
      </head>
      <body>{children}</body>
    </html>
  );
}
