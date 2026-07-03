import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Bendito Fantasy — FPL en español";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default Open Graph card (SPEC §16). Uses the brand accent. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            fontSize: 34,
            letterSpacing: 6,
            color: "#9a9a9a",
            textTransform: "uppercase",
          }}
        >
          Fantasy Premier League en español
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 150,
            fontWeight: 800,
            lineHeight: 0.95,
            color: "#F2594B",
            textTransform: "uppercase",
          }}
        >
          Bendito Fantasy
        </div>
      </div>
    ),
    size,
  );
}
