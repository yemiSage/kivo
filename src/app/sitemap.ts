import type { MetadataRoute } from "next";
import { absoluteUrl, publicPages } from "@/lib/discoverability";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map(page => ({ url: absoluteUrl(page.path), changeFrequency: page.changeFrequency, priority: page.priority }));
}
