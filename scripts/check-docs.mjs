import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Check local inline Markdown link/image paths. External URLs and heading anchors are not fetched.
const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8" })
  .split("\0").filter((file) => file.endsWith(".md") && existsSync(file));
let links = 0;
const failures = [];
for (const file of files) {
  const source = readFileSync(file, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const match of source.matchAll(/!?\[[^\]]*\]\((<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1].replace(/^<|>$/g, "");
    if (/^(?:[a-z][a-z\d+.-]*:|#|\/\/)/i.test(target)) continue;
    const path = decodeURIComponent(target.split(/[?#]/)[0]);
    if (!path) continue;
    links++;
    if (!existsSync(resolve(dirname(file), path))) failures.push(`${file}: missing ${path}`);
  }
}
for (const failure of failures) console.error(failure);
console.log(`Checked ${links} local Markdown link paths across ${files.length} files; ${failures.length} missing.`);
if (failures.length) process.exitCode = 1;
