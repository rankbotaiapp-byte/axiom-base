import type { Metadata } from "next";
import { Suspense } from "react";
import HomeChrome from "@/components/landing-v2/HomeChrome";
import "../styles.css";

export const metadata: Metadata = {
  title: "Axiom",
  description:
    "Trade storefronts in about 3 minutes from regional leads and a cinematic 3D hero. $1 for 14 days, then $150/mo. 1.5% on online bookings. 0% on cash and checks logged in the field.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark antialiased scroll-smooth" style={{ colorScheme: "dark" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@450;500;600&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
        />
      </head>
      <body className="relative min-h-dvh bg-[#030712] font-sans text-fg antialiased">
        <Suspense fallback={<div className="relative z-10 min-h-dvh bg-[#050507]">{children}</div>}>
          <HomeChrome>{children}</HomeChrome>
        </Suspense>
      </body>
    </html>
  );
}
