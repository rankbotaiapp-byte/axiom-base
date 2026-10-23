import type { Metadata } from "next";
import { Atmosphere } from "./atmosphere";
import "../styles.css";

export const metadata: Metadata = {
  title: "Axiom",
  description: "Instant booking sites for local service businesses.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="bg-transparent font-sans text-fg">
        <Atmosphere />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
