import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Reuses the bookmark shape in src/app/icons/[file]/route.tsx, not a new generated logo.
const source = new URL("../extensions/chrome/icon.svg", import.meta.url);
const output = new URL("../extensions/chrome/icons/", import.meta.url);
await mkdir(output, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  await sharp(fileURLToPath(source)).resize(size, size).png().toFile(fileURLToPath(new URL(`icon-${size}.png`, output)));
}
console.log("Prepared Chrome extension PNG icons at 16, 32, 48 and 128px.");
