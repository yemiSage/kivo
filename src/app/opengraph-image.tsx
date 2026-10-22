import { ImageResponse } from "next/og";

export const alt = "Kivo — A home for your good finds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 82px", background: "#f3f3f5", color: "#242426", fontFamily: "Arial, sans-serif" }}><div style={{ display: "flex", fontSize: 48, fontWeight: 700, letterSpacing: "-3px" }}>kivo</div><div style={{ display: "flex", flexDirection: "column" }}><div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.02, letterSpacing: "-4px", maxWidth: 900 }}>A home for your good finds.</div><div style={{ display: "flex", marginTop: 26, fontSize: 27, color: "#737378" }}>Save it. Organise it. Find it again.</div></div><div style={{ display: "flex", fontSize: 18, color: "#8b8b91" }}>Links, images and ideas — together.</div></div>, size);
}
