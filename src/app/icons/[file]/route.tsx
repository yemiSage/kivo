import { ImageResponse } from "next/og";

// Generates PNG app icons on demand: /icons/icon-192.png, /icons/maskable-512.png, /icons/apple-180.png
const ALLOWED: Record<string, { size: number; maskable: boolean }> = {
  "icon-192.png": { size: 192, maskable: false },
  "icon-512.png": { size: 512, maskable: false },
  "maskable-192.png": { size: 192, maskable: true },
  "maskable-512.png": { size: 512, maskable: true },
  "apple-180.png": { size: 180, maskable: true },
};

export const dynamic = "force-static";
export function generateStaticParams() {
  return Object.keys(ALLOWED).map((file) => ({ file }));
}

export async function GET(_: Request, ctx: { params: Promise<{ file: string }> }) {
  const spec = ALLOWED[(await ctx.params).file];
  if (!spec) return new Response("Not found", { status: 404 });
  const { size, maskable } = spec;
  const inner = maskable ? size * 0.62 : size * 0.78;

  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: maskable ? "#0a0a0a" : "transparent" }}>
        <div
          style={{
            width: inner,
            height: inner,
            borderRadius: maskable ? inner * 0.18 : inner * 0.26,
            background: "#0a0a0a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={inner * 0.5} height={inner * 0.5} viewBox="0 0 24 24" fill="none">
            <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1Z" fill="white" />
          </svg>
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
