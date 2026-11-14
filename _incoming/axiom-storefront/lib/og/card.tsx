import { ImageResponse } from "next/og";

/** Branded 1200×630 media card — used for OG/Twitter and as the image for social posts. */
export function brandCard(opts: { kicker: string; title: string; footer: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: "#03060b",
          backgroundImage: "radial-gradient(circle at 85% 0%, #0f3550 0%, #03060b 60%)",
          color: "#e9f7ff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 6, textTransform: "uppercase", color: "#8fdcff" }}>{opts.kicker}</div>
        <div style={{ display: "flex", fontSize: opts.title.length > 60 ? 58 : 70, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2 }}>
          {opts.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 26, color: "#b8d7ea" }}>
          <span>{opts.footer}</span>
          <span style={{ display: "flex", padding: "12px 26px", borderRadius: 999, border: "2px solid #ff7a1a", color: "#ffd9bd" }}>Book online 24/7</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
