const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_FILE = path.join(__dirname, "data", "responses.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, ngrok-skip-browser-warning",
  };
}

function readResponses() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendResponse(entry) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const list = readResponses();
  list.push(entry);
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

function send(res, status, body, headers) {
  res.writeHead(status, headers);
  res.end(body);
}

function serveStatic(req, res) {
  const url = new URL(req.url, "http://localhost");
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";

  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "Not found");
      return;
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    send(res, 200, data, { "Content-Type": type });
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/api/rsvp") {
    if (req.method === "OPTIONS") {
      send(res, 204, "", corsHeaders());
      return;
    }

    if (req.method !== "POST") {
      send(res, 405, "Method not allowed", corsHeaders());
      return;
    }

    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      let payload = {};
      try {
        payload = raw ? JSON.parse(raw) : {};
      } catch {
        payload = { raw };
      }

      appendResponse({
        ...payload,
        receivedAt: new Date().toISOString(),
      });

      send(res, 200, JSON.stringify({ ok: true }), {
        ...corsHeaders(),
        "Content-Type": "application/json; charset=utf-8",
      });
    });
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Method not allowed");
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Invite server http://localhost:${PORT}`);
});
