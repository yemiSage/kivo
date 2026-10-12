import "server-only";

/*
 * Category suggestions. Rules run instantly and for free; Gemini is used only
 * when GEMINI_API_KEY is set, with a tight timeout, and always falls back to
 * the rules. The result is a *suggestion*: it pre-selects a collection the user
 * already has, and never creates collections on its own.
 */

interface Input {
  title?: string | null;
  description?: string | null;
  siteName?: string | null;
  url?: string | null;
  platform?: string | null;
}

const RULES: { category: string; patterns: RegExp }[] = [
  {
    category: "Recipes",
    patterns: /\b(recipe|recipes|cook|cooking|bake|baking|ingredients?|dinner|lunch|breakfast|dessert|vegan|meal ?prep|allrecipes|tasty|bonappetit|seriouseats|food52|nyt ?cooking)\b/i,
  },
  {
    category: "Design Inspiration",
    patterns: /\b(design|ui|ux|typography|font|logo|branding|palette|interior|architecture|illustration|dribbble|behance|figma|moodboard|aesthetic|layout|poster)\b/i,
  },
  {
    category: "Business Ideas",
    patterns: /\b(startup|business|entrepreneur|founder|saas|revenue|marketing|growth|side ?hustle|ycombinator|pitch|investor|monetiz\w*|e-?commerce|strategy)\b/i,
  },
  {
    category: "Products",
    patterns: /\b(buy|shop|price|deal|sale|amazon|etsy|ebay|aliexpress|product|review|unboxing|\$\d+|£\d+|€\d+|add to cart)\b/i,
  },
  {
    category: "Read Later",
    patterns: /\b(article|essay|blog|newsletter|substack|medium\.com|guide|how to|explained|longread|paper|research)\b/i,
  },
];

export function ruleCategory(input: Input): string | null {
  const hay = [input.title, input.description, input.siteName, input.url].filter(Boolean).join(" ");
  if (!hay) return null;
  let best: { category: string; score: number } | null = null;
  for (const rule of RULES) {
    const matches = hay.match(new RegExp(rule.patterns.source, "gi"))?.length ?? 0;
    if (matches && (!best || matches > best.score)) best = { category: rule.category, score: matches };
  }
  return best?.category ?? null;
}

async function geminiCategory(input: Input, options: string[]): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || options.length === 0) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const prompt = [
    "Pick the single best collection for this saved item.",
    `Collections: ${options.map((o) => JSON.stringify(o)).join(", ")}`,
    'Reply with JSON only: {"collection": "<exact name from the list or null>"}',
    "",
    `Title: ${input.title ?? ""}`,
    `Description: ${(input.description ?? "").slice(0, 600)}`,
    `Source: ${input.siteName ?? input.platform ?? ""} ${input.url ?? ""}`,
  ].join("\n");

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 60, responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const picked = (JSON.parse(text) as { collection?: string | null }).collection;
    return picked && options.includes(picked) ? picked : null;
  } catch {
    return null;
  }
}

/** Returns the name of one of `collectionNames`, or a generic category, or null. */
export async function suggestCategory(input: Input, collectionNames: string[]): Promise<string | null> {
  const ai = await geminiCategory(input, collectionNames);
  if (ai) return ai;
  return ruleCategory(input);
}
