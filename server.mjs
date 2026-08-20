import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".webp": "image/webp"
};

createServer((request, response) => {
  const requestPath = decodeURIComponent((request.url || "/").split("?")[0]);
  const relative = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const filePath = normalize(join(root, relative));

  if (!filePath.startsWith(root) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const fileSize = statSync(filePath).size;
  const contentType = types[extname(filePath).toLowerCase()] || "application/octet-stream";
  const range = request.headers.range;
  const baseHeaders = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
    "Content-Type": contentType
  };

  if (range?.startsWith("bytes=")) {
    const [startText, endText] = range.slice(6).split("-", 2);
    const start = startText ? Number(startText) : 0;
    const requestedEnd = endText ? Number(endText) : fileSize - 1;
    const end = Math.min(requestedEnd, fileSize - 1);

    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > end || start >= fileSize) {
      response.writeHead(416, {
        ...baseHeaders,
        "Content-Range": `bytes */${fileSize}`
      });
      response.end();
      return;
    }

    response.writeHead(206, {
      ...baseHeaders,
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${fileSize}`
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(filePath, { start, end }).pipe(response);
    return;
  }

  response.writeHead(200, {
    ...baseHeaders,
    "Content-Length": fileSize
  });
  if (request.method === "HEAD") response.end();
  else createReadStream(filePath).pipe(response);
}).listen(port, host, () => {
  console.log(`Yixin's portfolio is running at http://${host}:${port}`);
});
