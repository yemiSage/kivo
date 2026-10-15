import { access } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const input = process.argv[2];
if (!input) throw new Error("Usage: npm run prepare:background -- /path/to/generated-image.png [--force]");
const output = resolve("public/kivo-canvas-v2.webp");
let exists = false;
try { await access(output); exists = true; } catch { /* New output file. */ }
if (exists && !process.argv.includes("--force")) throw new Error("Background already exists. Review the source and use --force to replace it.");
const result = await sharp(resolve(input)).resize(1200, 750, { fit: "cover" }).webp({ quality: 76 }).toFile(output);
console.log(JSON.stringify({ output, width: result.width, height: result.height, bytes: result.size }));
