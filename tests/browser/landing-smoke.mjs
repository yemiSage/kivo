import assert from "node:assert/strict";
import { chromium } from "playwright";

const origin = process.env.TEST_APP_ORIGIN || "http://localhost:3000";
const browser = await chromium.launch({ headless: true });
try {
  for (const [width, height] of [[1440, 960], [390, 844], [320, 568]]) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 768, hasTouch: width < 768 });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${origin}/welcome`, { timeout: 120000 });
    await page.getByRole("heading", { level: 1 }).waitFor();
    if (width >= 768) {
      assert.equal(await page.locator("header nav").getByRole("link", { name: "Home", exact: true }).getAttribute("href"), "/welcome");
      assert.equal(await page.locator("header nav").getByRole("link", { name: "How it works", exact: true }).getAttribute("href"), "/welcome/how-it-works");
      assert.equal(await page.locator("header nav").getByRole("link", { name: "Features", exact: true }).getAttribute("href"), "/welcome/features");
      assert.equal(await page.locator("header nav").getByRole("link", { name: "FAQ" }).getAttribute("href"), "/welcome/faq");
      assert.equal(await page.locator("header nav").getByRole("link", { name: "Contact us" }).getAttribute("href"), "/welcome/contact");
    } else {
      assert.equal(await page.locator("header nav").isVisible(), false);
    }
    assert.equal(await page.getByText("Your memory, with a search bar.", { exact: true }).count(), 0);
    assert.equal(await page.locator("header").getByRole("link", { name: "Get started" }).getAttribute("href"), "/login");
    assert.equal(await page.getByRole("link", { name: "Privacy", exact: true }).getAttribute("href"), "/welcome/privacy");
    assert.equal(await page.getByRole("link", { name: "Terms of use", exact: true }).getAttribute("href"), "/welcome/terms");
    await page.locator("footer").getByText("© 2026 Kivo", { exact: true }).waitFor();
    assert.equal(await page.locator("footer").getByRole("link", { name: "Open source", exact: true }).getAttribute("href"), "https://github.com/yemiSage/kivo");
    const headerTop = await page.locator("header").evaluate(node => node.getBoundingClientRect().top);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const [index, id, label] of [[1, "save", "Save"], [2, "organise", "Organise"], [3, "find", "Find"], [4, "start", "Get Kivo"]]) {
      await page.getByRole("button", { name: `${index + 1}. ${label}`, exact: true }).click();
      await page.waitForFunction(id => document.getElementById(id)?.getAttribute("data-active") === "true", id);
      assert.equal(await page.locator("main section:not([inert])").count(), 1);
      assert.equal(await page.locator("header").evaluate(node => node.getBoundingClientRect().top), headerTop);
      if (id === "find") {
        assert.equal(await page.locator("#find").getByRole("button", { name: "Keep exploring", exact: true }).locator("svg").count(), 0);
        assert.match(await page.locator("#find-title").evaluate(node => getComputedStyle(node).fontFamily), /Bricolage Grotesque/i);
      }
    }
    assert.equal(await page.getByRole("link", { name: "Start your collection" }).getAttribute("href"), "/login");
    assert.equal(await page.getByRole("link", { name: "Chrome extension" }).getAttribute("href"), "/downloads/kivo-chrome-extension.zip");
    await page.getByRole("main").focus();
    await page.keyboard.press("Home");
    await page.waitForFunction(() => document.querySelector("#intro")?.getAttribute("data-active") === "true");
    await page.getByRole("main").evaluate(node => node.scrollTo({ top: node.clientHeight * 3, behavior: "instant" }));
    await page.waitForFunction(() => document.querySelector("#find")?.getAttribute("data-active") === "true");
    assert.equal(await page.evaluate(() => window.scrollY), 0, "Only the fixed stage should scroll");
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}×${height}: sections, fixed header, navigation, keyboard, scroll, links and viewport fit.`);
    await context.close();
  }
  const reduced = await browser.newPage({ reducedMotion: "reduce" });
  await reduced.goto(`${origin}/welcome`);
  await reduced.getByRole("button", { name: "3. Organise", exact: true }).click();
  await reduced.waitForFunction(() => document.querySelector("#organise")?.getAttribute("data-active") === "true");
  assert.equal(await reduced.locator("#organise").evaluate(node => getComputedStyle(node).transform), "none");
  // A new visitor reaches the landing page; protected destinations retain login.
  await reduced.goto(`${origin}/`);
  await reduced.waitForURL(`${origin}/welcome`);
  await reduced.goto(`${origin}/save?url=https%3A%2F%2Fexample.com&source=chrome-extension`);
  await reduced.waitForURL(`${origin}/login?**`);
  assert.equal(await reduced.getByRole("link", { name: "Terms of Use", exact: true }).getAttribute("href"), "/welcome/terms");
  assert.equal(await reduced.getByRole("link", { name: "Privacy Policy", exact: true }).getAttribute("href"), "/welcome/privacy");
  const next = new URL(reduced.url()).searchParams.get("next");
  assert.equal(next, "/save?url=https%3A%2F%2Fexample.com&source=chrome-extension");
  console.log("PASS reduced motion, public landing route and protected save handoff.");
  for (const [path, title] of [["privacy", "Privacy Policy"], ["terms", "Terms of Use"]]) {
    await reduced.goto(`${origin}/welcome/${path}`);
    await reduced.getByRole("heading", { name: title, level: 1, exact: true }).waitFor();
    await reduced.getByRole("navigation", { name: "On this page" }).getByRole("link").last().click();
    assert.ok(new URL(reduced.url()).hash.length > 1);
    assert.ok(await reduced.locator("article").getByText("MaestroTG", { exact: false }).count() > 0);
    assert.ok(await reduced.locator("article a[href='https://github.com/yemiSage/kivo']").count() > 0);
    if (path === "terms") assert.equal(await reduced.locator("article a[href='https://github.com/yemiSage/kivo/blob/main/LICENSE']").count(), 1);
    assert.ok(await reduced.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  console.log("PASS public policy pages, operator identity and section links.");
  for (const width of [1440, 390, 320]) {
    await reduced.setViewportSize({ width, height: 900 });
    for (const [path, heading, current] of [["how-it-works", /Three small steps/, "How it works"], ["features", /Built for the/, "Features"], ["faq", /A few things/, "FAQ"], ["contact", /The right place/, "Contact us"]]) {
      await reduced.goto(`${origin}/welcome/${path}`);
      await reduced.getByRole("heading", { level: 1, name: heading }).waitFor();
      assert.equal(await reduced.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: current, exact: true }).getAttribute("aria-current"), "page");
      assert.ok(await reduced.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.match(await reduced.locator("h1").evaluate(node => getComputedStyle(node).fontFamily), /Bricolage Grotesque/i);
    }
  }
  await reduced.goto(`${origin}/welcome/faq`);
  assert.equal(await reduced.locator("details").count(), 7);
  await reduced.getByText("What can I save?", { exact: true }).click();
  assert.equal(await reduced.locator("#what-can-i-save").getAttribute("open"), "");
  await reduced.goto(`${origin}/welcome/contact`);
  assert.ok(await reduced.getByText("MaestroTG", { exact: false }).count() > 0);
  console.log("PASS How it works, Features, FAQ and Contact public-page layouts.");
} finally {
  await browser.close();
}
