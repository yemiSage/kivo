import { mkdir, readFile, writeFile } from "node:fs/promises";
import { crc32, deflateRawSync } from "node:zlib";

// Explicit allowlist: never bundle credentials, workspace files or build output.
const files = ["manifest.json", "service-worker.mjs", "save-url.mjs", "options.html", "options.css", "options.mjs", "README.md", "PRIVACY.md",
  ...[16, 32, 48, 128].map(size => `icons/icon-${size}.png`)];
const entries = await Promise.all(files.map(async name => ({ name, data: await readFile(new URL(`../extensions/chrome/${name}`, import.meta.url)) })));
entries.push({ name: "LICENSE", data: await readFile(new URL("../LICENSE", import.meta.url)) });
const local = [], central = [];
let offset = 0;
for (const { name, data } of entries) {
  const filename = Buffer.from(name);
  const compressed = deflateRawSync(data);
  const checksum = crc32(data);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x800, 6); // UTF-8 filenames.
  header.writeUInt16LE(8, 8); // Deflate.
  header.writeUInt16LE(0x21, 12); // Fixed 1980-01-01 date for reproducible output.
  header.writeUInt32LE(checksum, 14);
  header.writeUInt32LE(compressed.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(filename.length, 26);
  local.push(header, filename, compressed);
  const record = Buffer.alloc(46);
  record.writeUInt32LE(0x02014b50, 0);
  record.writeUInt16LE(20, 4);
  header.copy(record, 6, 4, 28);
  record.writeUInt32LE(offset, 42);
  central.push(record, filename);
  offset += header.length + filename.length + compressed.length;
}
const directory = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(entries.length, 8);
end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(directory.length, 12);
end.writeUInt32LE(offset, 16);
const output = new URL("../public/downloads/kivo-chrome-extension.zip", import.meta.url);
await mkdir(new URL(".", output), { recursive: true });
await writeFile(output, Buffer.concat([...local, directory, end]));
console.log(`Packaged ${entries.length} extension files: ${output.pathname}`);
