import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Deliberately reports locations and rule names only, never matching values.
const rules = [
  ["private-key", /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/],
  ["github-token", /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ["google-api-key", /\bAIza[A-Za-z0-9_-]{35}\b/],
  ["brevo-api-key", /\bxkeysib-[a-f0-9]{40,}\b/i],
  ["supabase-secret-key", /\bsb_secret_[A-Za-z0-9_-]{20,}\b/],
  ["aws-access-key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
];
const findings = [];
let checked = 0;

function inspect(buffer, location) {
  if (buffer.includes(0)) return;
  checked++;
  const text = buffer.toString("utf8");
  for (const [name, pattern] of rules) {
    if (pattern.test(text)) findings.push({ location, rule: name });
  }
  for (const token of text.matchAll(/\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g)) {
    try {
      if (JSON.parse(Buffer.from(token[0].split(".")[1], "base64url").toString()).role === "service_role") {
        findings.push({ location, rule: "supabase-service-role-jwt" });
      }
    } catch { /* Not a parseable JWT. */ }
  }
}

const git = (args, options = {}) => execFileSync("git", args, { maxBuffer: 32 * 1024 * 1024, ...options });
const files = git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"]).toString().split("\0").filter(Boolean);
for (const file of files) {
  try { inspect(readFileSync(file), file); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}

let historyBlobs = 0;
if (process.argv.includes("--history")) {
  const objects = git(["rev-list", "--objects", "--all"]).toString().trim().split("\n");
  const paths = new Map(objects.map((line) => {
    const space = line.indexOf(" ");
    return space < 0 ? [line, "unknown path"] : [line.slice(0, space), line.slice(space + 1)];
  }));
  const rows = git(["cat-file", "--batch-check=%(objectname) %(objecttype) %(objectsize)"], { input: [...paths.keys()].join("\n") + "\n" }).toString().trim().split("\n");
  for (const row of rows) {
    const [hash, type, size] = row.split(" ");
    if (type !== "blob") continue;
    if (Number(size) > 8 * 1024 * 1024) {
      console.error(`History blob too large for this check: ${hash} ${paths.get(hash)}. Review it separately.`);
      process.exitCode = 1;
      continue;
    }
    historyBlobs++;
    inspect(git(["cat-file", "blob", hash]), `history:${hash.slice(0, 12)}:${paths.get(hash)}`);
  }
}

for (const finding of findings) console.error(`${finding.location}: ${finding.rule} [value redacted]`);
console.log(JSON.stringify({ workingFiles: files.length, historyBlobs, textRevisionsChecked: checked, findings: findings.length }));
console.log("Pattern check only: manually review assets, personal data, generic secrets and unreachable Git objects before release.");
if (findings.length) process.exitCode = 1;
