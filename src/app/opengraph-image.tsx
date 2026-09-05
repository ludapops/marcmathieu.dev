import { ImageResponse } from "next/og";
export const alt =
  "Marc Mathieu — Senior frontend engineer. Complex products, carefully made.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "#111211",
        color: "#f2f0e9",
        padding: 54,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 17, letterSpacing: 3 }}>
        SENIOR FRONTEND ENGINEER / MIAMI
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 112,
          letterSpacing: -7,
          marginTop: 52,
        }}
      >
        Marc Mathieu
      </div>
      <div style={{ display: "flex", fontSize: 32, marginTop: 14 }}>
        Complex products, carefully made.
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 60, height: 145 }}>
        {[
          { label: "01 / AG1", color: "#233d2a", ink: "#f2f0e9" },
          { label: "02 / Battlefield", color: "#282922", ink: "#ff8256" },
          { label: "03 / BeautyNexos", color: "#d7cee1", ink: "#241f29" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              flex: 1,
              padding: 24,
              background: item.color,
              color: item.ink,
              alignItems: "center",
              fontSize: 28,
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
