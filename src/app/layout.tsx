import type { Metadata } from "next";
import { Atmosphere } from "./atmosphere";
import "../styles.css";

export const metadata: Metadata = {
  title: "Axiom",
  description:
    "Instant booking sites for local service businesses. Start for $1, then $150/mo — or lock Founder's Lifetime for $1000.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark antialiased" style={{ colorScheme: "dark" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@450;500;600&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-dvh bg-[#030712] font-sans text-fg antialiased">
        <Atmosphere />
        <div className="relative z-10 min-h-dvh bg-transparent">{children}</div>
      </body>
    </html>
  );
}
