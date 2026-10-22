import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import { PwaClient } from "@/components/PwaClient";
import { cn } from "@/lib/utils";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/discoverability";
import "./globals.css";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage-grotesque",
});

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: { default: "Kivo", template: "%s · Kivo" },
  description: SITE_DESCRIPTION,
  applicationName: "Kivo",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Kivo", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icons/icon-32.png?v=k-mark-1", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png?v=k-mark-1", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-180.png?v=k-mark-1", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e7e7e4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(GeistSans.variable, GeistMono.variable, bricolageGrotesque.variable)}>
      <body className="min-h-dvh antialiased">
        {children}
        <PwaClient />
        <Toaster />
      </body>
    </html>
  );
}
