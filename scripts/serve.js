import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve(import.meta.dirname, "..");
const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
};
const port = Number(option("--port", process.env.PORT || 8080));
const host = option("--host", "127.0.0.1");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};
http
  .createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const file = resolve(
        root,
        `.${pathname === "/" ? "/index.html" : pathname}`,
      );
      if (!file.startsWith(root + sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      const data = await readFile(file);
      res.setHeader(
        "Content-Type",
        types[extname(file)] || "application/octet-stream",
      );
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(port, host, () =>
    console.log(`Expedition Lab http://${host}:${port}`),
  );
