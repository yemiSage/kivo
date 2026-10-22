import type { Metadata } from "next";

export const SITE_NAME = "Kivo";
export const SITE_DESCRIPTION = "Save links, images and ideas, organise them into private vaults, and find them again when you need them.";
export const PRODUCTION_FALLBACK_ORIGIN = "https://kivo-save.vercel.app";

function configuredOrigin() {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!candidate || (process.env.NODE_ENV === "production" && /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(candidate))) return PRODUCTION_FALLBACK_ORIGIN;
  try {
    const url = new URL(candidate);
    if (!/^https?:$/.test(url.protocol)) return PRODUCTION_FALLBACK_ORIGIN;
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url.origin;
  } catch {
    return PRODUCTION_FALLBACK_ORIGIN;
  }
}

export const SITE_ORIGIN = configuredOrigin();
export const SITE_URL = new URL(SITE_ORIGIN);

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_ORIGIN}/`).toString();
}

export function publicMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  const url = absoluteUrl(path);
  const socialImage = absoluteUrl("/opengraph-image");
  const socialTitle = path === "/welcome" ? "Kivo — A home for your good finds" : `${title} · Kivo`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      locale: "en_NG",
      title: socialTitle,
      description,
      images: [{ url: socialImage, width: 1200, height: 630, alt: "Kivo — a home for your good finds" }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [{ url: socialImage, alt: "Kivo — a home for your good finds" }],
    },
  };
}

export const publicPages = [
  { path: "/welcome", priority: 1, changeFrequency: "monthly" as const },
  { path: "/welcome/how-it-works", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/welcome/features", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/welcome/faq", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/welcome/contact", priority: 0.6, changeFrequency: "yearly" as const },
  { path: "/welcome/privacy", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/welcome/terms", priority: 0.4, changeFrequency: "yearly" as const },
];

export function websiteSchema() {
  return { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/welcome"), description: SITE_DESCRIPTION, inLanguage: "en" };
}

export function applicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    url: absoluteUrl("/welcome"),
    description: SITE_DESCRIPTION,
    featureList: ["Save links and images", "Organise finds into private vaults", "Search saved content", "Collaborate through shared vaults", "Install as a progressive web app"],
  };
}
