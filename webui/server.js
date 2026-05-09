const http = require("http")
const https = require("https")
const fs = require("fs")
const path = require("path")
const { URL } = require("url")

const root = __dirname
const launcherRoot = path.resolve(root, "..")

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8"
}

function getArg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  if (index === -1 || index + 1 >= process.argv.length) return fallback
  return process.argv[index + 1]
}

const host = getArg("host", "127.0.0.1")
const port = Number(getArg("port", process.env.PORT || "4173"))
const target = new URL(getArg("target", process.env.DS4_URL || "http://127.0.0.1:8000"))

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  })
  res.end(body)
}

function serveFile(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  let pathname = decodeURIComponent(requestUrl.pathname)
  if (pathname === "/") pathname = "/index.html"

  let filePath
  if (pathname === "/icon.png") {
    filePath = path.join(launcherRoot, "icon.png")
  } else {
    filePath = path.join(root, pathname)
  }

  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(root) && resolved !== path.join(launcherRoot, "icon.png")) {
    send(res, 403, "Forbidden")
    return
  }

  fs.readFile(resolved, (err, data) => {
    if (err) {
      send(res, 404, "Not found")
      return
    }
    const ext = path.extname(resolved)
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=3600"
    })
    res.end(data)
  })
}

function proxy(req, res) {
  const incomingUrl = new URL(req.url, `http://${req.headers.host}`)
  const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, target)
  const client = upstreamUrl.protocol === "https:" ? https : http
  const headers = { ...req.headers }

  delete headers.host
  delete headers.connection
  delete headers["accept-encoding"]

  const upstream = client.request(upstreamUrl, {
    method: req.method,
    headers
  }, (upstreamRes) => {
    const responseHeaders = { ...upstreamRes.headers }
    responseHeaders["Access-Control-Allow-Origin"] = "*"
    res.writeHead(upstreamRes.statusCode || 502, responseHeaders)
    upstreamRes.pipe(res)
  })

  upstream.on("error", (err) => {
    send(res, 502, JSON.stringify({
      error: {
        message: `Unable to reach ds4 server at ${target.origin}: ${err.message}`
      }
    }), "application/json; charset=utf-8")
  })

  req.pipe(upstream)
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization"
    })
    res.end()
    return
  }

  if (req.url === "/__ds4/config") {
    send(res, 200, JSON.stringify({
      target: target.origin,
      model: "deepseek-v4-flash"
    }), "application/json; charset=utf-8")
    return
  }

  if (req.url.startsWith("/v1/")) {
    proxy(req, res)
    return
  }

  serveFile(req, res)
})

server.listen(port, host, () => {
  console.log(`Web UI listening at http://${host}:${port}`)
  console.log(`Proxying ds4 API at ${target.origin}`)
})

process.on("SIGINT", () => server.close(() => process.exit(0)))
process.on("SIGTERM", () => server.close(() => process.exit(0)))
