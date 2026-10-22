import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/discoverability";

const privatePaths = ["/admin/", "/api/", "/auth/", "/collections/", "/item/", "/login/", "/offline/", "/profile/", "/save/", "/share-target/", "/vault-invite/"];
const searchRules = (userAgent: string | string[]) => ({ userAgent, allow: ["/welcome", "/llms.txt"], disallow: privatePaths });

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      searchRules("*"),
      searchRules(["Googlebot", "Bingbot", "OAI-SearchBot", "PerplexityBot"]),
      { userAgent: ["GPTBot", "Google-Extended"], disallow: "/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/").replace(/\/$/, ""),
  };
}
