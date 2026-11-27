import { createHash } from "node:crypto";
import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const modules = (await readdir(resolve(root, "src"))).filter(f => f.endsWith(".js")).sort();
const assets = (await readdir(resolve(root, "assets"))).sort();
const files = ["index.html", "style.css", "retro.css", ...modules.map(f => `src/${f}`), ...assets.map(f => `assets/${f}`)];
const stripMap = text => text.replace(/\s*<script type="importmap" id="asset-versions">[\s\S]*?<\/script>/, "");
const normalize = text => stripMap(text).replace(/\?v=[a-f0-9]{12}/g, "");
const contents = new Map(await Promise.all(files.map(async file => [file, normalize(await readFile(resolve(root,file),"utf8"))])));
const hash = createHash("sha256");
for (const [file,text] of contents) hash.update(file).update("\0").update(text);
const version = hash.digest("hex").slice(0,12);
const imports = Object.fromEntries(modules.map(file => [`./src/${file}`,`./src/${file}?v=${version}`]));
let html = contents.get("index.html");
html = html.replace(/href="(style\.css|retro\.css)"/g, `href="$1?v=${version}"`);
html = html.replace('    <script type="module" src="src/app.js"></script>',
  `    <script type="importmap" id="asset-versions">${JSON.stringify({imports})}</script>\n    <script type="module" src="src/app.js?v=${version}"></script>`);
await writeFile(resolve(root,"index.html"),html);
// Relative texture URLs stay relative to the stylesheet, including under a
// GitHub Pages project path. Version these alongside the scripts and styles.
const css = contents.get("retro.css").replace(/url\("(assets\/[^"?#]+)"\)/g, `url("$1?v=${version}")`);
await writeFile(resolve(root,"retro.css"),css);
console.log(`Asset version ${version}: styles, modules, and textures refreshed.`);
