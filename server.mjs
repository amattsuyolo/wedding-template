import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, normalize, resolve, sep } from "node:path";

const requestedRoot = process.argv[2] || ".";
const root = resolve(requestedRoot);
const port = Number(process.env.PORT || 4173);
const mime = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".webp": "image/webp"
};

const sendText = (response, status, message, headers = {}) => {
  response.writeHead(status, { "content-type": "text/plain; charset=utf-8", ...headers });
  response.end(message);
};

createServer((request, response) => {
  if (!request.method || !["GET", "HEAD"].includes(request.method)) {
    sendText(response, 405, "Method not allowed", { allow: "GET, HEAD" });
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`).pathname);
  } catch {
    sendText(response, 400, "Bad request");
    return;
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const resolvedPath = resolve(root, normalize(relativePath));

  if (!resolvedPath.startsWith(`${root}${sep}`) || !existsSync(resolvedPath)) {
    sendText(response, 404, "Not found");
    return;
  }

  try {
    if (statSync(resolvedPath).isDirectory()) {
      sendText(response, 404, "Not found");
      return;
    }
  } catch {
    sendText(response, 404, "Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": mime[extname(resolvedPath)] || "application/octet-stream",
    "cache-control": "no-cache",
    "content-security-policy": "default-src 'self'; img-src 'self' data:; style-src 'self'; font-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-content-type-options": "nosniff"
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  const stream = createReadStream(resolvedPath);
  stream.on("error", () => response.destroy());
  stream.pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Fifi & Leo preview: http://127.0.0.1:${port}`);
});
