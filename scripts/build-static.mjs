import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = process.cwd();
const output = join(root, "dist");
const sourceFiles = ["index.html", "styles.css", "site-data.js", "app.js"];

await rm(output, { force: true, recursive: true });
await mkdir(output, { recursive: true });

for (const file of sourceFiles) {
  await cp(join(root, file), join(output, file));
}

const source = await Promise.all(
  sourceFiles.map((file) => readFile(join(root, file), "utf8")),
);
const assetPaths = [
  ...new Set(source.join("\n").match(/assets\/[A-Za-z0-9._/-]+/g) || []),
].sort();

for (const assetPath of assetPaths) {
  const destination = join(output, assetPath);
  await mkdir(dirname(destination), { recursive: true });
  await cp(join(root, assetPath), destination);
}

console.log(`Built ${sourceFiles.length} source files and ${assetPaths.length} runtime assets in dist/.`);
