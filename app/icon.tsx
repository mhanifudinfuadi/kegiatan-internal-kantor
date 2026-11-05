import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 25%, #fff6fa 0%, #f6b8d0 45%, #c2587f 100%)",
          color: "#3a2631",
          fontSize: 20,
          fontWeight: 700,
          borderRadius: 999,
        }}
      >
        花
      </div>
    ),
    size,
  );
}
