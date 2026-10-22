# AI search implementation

The same crawlable public HTML used by people is the primary AI-search surface. No special schema guarantees AI inclusion. `/llms.txt` is supplementary and contains only public product facts, boundaries and authoritative URLs.

The crawler policy separates search discovery from model-training controls. OAI-SearchBot and PerplexityBot may crawl public paths. GPTBot and Google-Extended are denied. User-triggered fetchers may not use robots.txt as their control surface.

References: [OpenAI crawlers](https://developers.openai.com/api/docs/bots), [Perplexity crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers), and [Google AI features](https://developers.google.com/search/docs/appearance/ai-features).
