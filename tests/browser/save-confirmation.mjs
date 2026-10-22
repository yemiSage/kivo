import assert from "node:assert/strict";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { chromium } from "playwright";

// A temporary public fixture renders the real components without a user session.
// All action POSTs and metadata requests are intercepted: no backend is touched.
const fixture = new URL("../../src/app/login/kivo-save-confirmation-fixture/", import.meta.url);
const base = process.env.TEST_APP_ORIGIN || "http://localhost:3000";
await mkdir(fixture);
await writeFile(new URL("page.tsx", fixture), `
import { SaveScreen } from "@/components/SaveScreen";
export default function Fixture() {
  return <SaveScreen collections={[]} share={{ source: "chrome-extension", url: "https://example.com/article", title: "Original page title" }} />;
}
`);
let browser;
try {
  browser = await chromium.launch({ headless: true });
  for (const width of [360, 1000]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const actions = [];
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/api/metadata?**", route => route.fulfill({ status: 404 }));
  await page.route(`${base}/**`, async route => {
    const request = route.request();
    if (request.method() !== "POST") return route.continue();
    const body = request.postData() || "";
    actions.push(body);
    const vaultName = ["Travel", "Recipes"].find(name => body === JSON.stringify([name]));
    const result = vaultName
      ? { ok: true, data: { collection: { id: `test-${vaultName}`, name: vaultName } } }
      : { ok: false, error: "Test save received" };
    await route.fulfill({ contentType: "text/x-component", body: `0:${JSON.stringify({ a: result })}\n` });
  });
  await page.goto(`${base}/login/kivo-save-confirmation-fixture`, { timeout: 120000 });
  await page.getByLabel("Link", { exact: true }).waitFor();
  await page.waitForFunction(() => document.querySelector("#link")?.value === "https://example.com/article");
  await page.getByText("Review the link, choose a vault, then click Save.").waitFor();
  assert.equal(actions.length, 0, "Opening an extension link must not save it");
  await page.getByRole("button", { name: "New", exact: true }).click();
  await page.getByRole("textbox", { name: "New vault name" }).fill("Travel");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("radio", { name: "Travel" }).waitFor();
  assert.equal(actions.length, 1, "Creating a vault must not submit the parent save form");
  assert.equal(await page.getByRole("radio", { name: "Travel" }).getAttribute("aria-checked"), "true");
  assert.equal(await page.locator("form form").count(), 0, "Vault creation must not nest a form inside the Save form");
  await page.getByRole("button", { name: "New", exact: true }).click();
  await page.getByRole("textbox", { name: "New vault name" }).fill("Recipes");
  await page.getByRole("textbox", { name: "New vault name" }).press("Enter");
  await page.getByRole("radio", { name: "Recipes" }).waitFor();
  assert.equal(actions.length, 2, "Enter must create only the vault, without saving the link");
  assert.equal(await page.getByRole("radio", { name: "Recipes" }).getAttribute("aria-checked"), "true");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Test save received" }).waitFor();
  assert.equal(actions.length, 3);
  assert.ok(actions[2].includes("Original page title"), "Explicit Save must retain the incoming title");
  assert.ok(actions[2].includes("test-Recipes"), "Explicit Save must use the newly created vault");
  assert.deepEqual(errors, []);
  await page.close();
  console.log(`PASS at ${width}px: Add and Enter create and select vaults without saving a link; explicit Save retains the title and new vault.`);
  }
} finally {
  await browser?.close();
  await rm(fixture, { recursive: true, force: true });
}
