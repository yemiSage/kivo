import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import sharp from "sharp";

const port = await new Promise((resolve, reject) => {
  const reservation = createServer();
  reservation.once("error", reject);
  reservation.listen(0, "127.0.0.1", () => {
    const address = reservation.address();
    if (!address || typeof address === "string") {
      reservation.close();
      reject(new Error("Could not reserve a production test port."));
      return;
    }
    reservation.close(error => error ? reject(error) : resolve(address.port));
  });
});
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NODE_ENV: "production" } });
let output = "";
child.stdout.on("data", chunk => { output += chunk; });
child.stderr.on("data", chunk => { output += chunk; });

async function fetchReady(path = "/welcome") {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Production server exited with code ${child.exitCode}.\n${output}`);
    try {
      const response = await fetch(`${origin}${path}`);
      if (response.status < 500) return response;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error(`Production server did not become ready.\n${output}`);
}

try {
  await fetchReady();
  const robots = await (await fetch(`${origin}/robots.txt`)).text();
  assert.match(robots, /User-Agent: OAI-SearchBot/);
  assert.match(robots, /User-Agent: PerplexityBot/);
  assert.match(robots, /User-Agent: GPTBot[\s\S]*Disallow: \//);
  assert.match(robots, /Sitemap: https:\/\/kivo-save\.vercel\.app\/sitemap\.xml/);

  const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
  for (const path of ["/welcome", "/welcome/faq", "/welcome/contact", "/welcome/privacy", "/welcome/terms"]) assert.match(sitemap, new RegExp(`<loc>https://kivo-save\\.vercel\\.app${path.replaceAll("/", "\\/")}</loc>`));
  assert.doesNotMatch(sitemap, /\/(?:admin|api|login|collections|profile|save)</);

  const llms = await (await fetch(`${origin}/llms.txt`)).text();
  assert.match(llms, /^# Kivo/m);
  assert.match(llms, /Account content is private/);
  assert.doesNotMatch(llms, /(?:SERVICE_ROLE|API_KEY|SECRET)/);

  for (const path of ["/welcome", "/welcome/faq", "/welcome/contact", "/welcome/privacy", "/welcome/terms"]) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(`<link rel="canonical" href="https://kivo-save\\.vercel\\.app${path.replaceAll("/", "\\/")}"`));
    assert.match(html, /property="og:title"/);
    assert.match(html, /name="twitter:card" content="summary_large_image"/);
    assert.doesNotMatch(html, /name="robots" content="noindex/);
  }

  const welcomeHtml = await (await fetch(`${origin}/welcome`)).text();
  assert.match(welcomeHtml, /application\/ld\+json/);
  const imageUrl = welcomeHtml.match(/property="og:image" content="([^"]+)"/)?.[1];
  assert.ok(imageUrl, "Open Graph image URL is present");
  const imageResponse = await fetch(imageUrl.replace("https://kivo-save.vercel.app", origin));
  assert.equal(imageResponse.headers.get("content-type"), "image/png");
  const image = await sharp(Buffer.from(await imageResponse.arrayBuffer())).metadata();
  assert.deepEqual([image.width, image.height], [1200, 630]);

  const login = await fetch(`${origin}/login`);
  assert.match(login.headers.get("x-robots-tag") ?? "", /noindex/);
  assert.match(await login.text(), /name="robots" content="noindex/);
  console.log("PASS production discoverability endpoints, metadata, social image, structured data and private-route controls.");
} finally {
  child.kill();
  if (child.exitCode === null) await Promise.race([once(child, "exit"), new Promise(resolve => setTimeout(resolve, 3000))]);
}
