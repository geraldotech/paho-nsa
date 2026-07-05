import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 8080;

function setSecurityHeaders(res) {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", "frame-ancestors 'none';");
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
  setSecurityHeaders(res);

  const urlPath = decodeURIComponent(req.url.split("?")[0]);

  // Redirect root to /official-relations
  if (urlPath === "/") {
    res.statusCode = 302;
    res.setHeader("Location", "/official-relations");
    res.end();
    return;
  }

  // Serve the SPA entrypoint at /official-relations
  if (urlPath === "/official-relations" || urlPath === "/official-relations/") {
    const filePath = path.join(__dirname, "index.html");

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Not Found");
        return;
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      fs.createReadStream(filePath).pipe(res);
    });
    return;
  }

  // Static files
  const relativePath = path
    .normalize(urlPath)
    .replace(/^(\.\.(\/|\\|$))+/, "")
    .replace(/^[/\\]+/, "");

  const filePath = path.join(__dirname, relativePath);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader("Content-Type", mime[ext] || "application/octet-stream");
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(port, () => console.log(`Listening on ${port}`));