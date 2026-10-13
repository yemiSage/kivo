import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const adminHost = process.env.ADMIN_HOST?.trim() || "adminkivo-save.vercel.app";
    return [
      {
        source: "/",
        has: [{ type: "host", value: adminHost }],
        destination: "/admin",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/kivo-canvas-v1.webp",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // The service worker must never be cached by the HTTP cache, or updates stall.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
