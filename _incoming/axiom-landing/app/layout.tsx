import type { Metadata, Viewport } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Axiom — The Fully Automated Back Office for Contractors",
  description:
    "Booking, routing & dispatch on autopilot. Pick your trade's template, edit it in minutes, and pay once — own it forever.",
  openGraph: {
    title: "Axiom — Booking, Routing & Dispatch on Autopilot",
    description: "The automated back office + custom phone app for local contractors. Pay once, own it forever.",
    images: ["/media/axioms-heart-poster.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#06080b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" href="/media/axioms-heart-poster.jpg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
