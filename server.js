const PORT = process.env.PORT || 3000;

const TOKEN = process.env.MCP_ACCESS_TOKEN;
const PATH_SECRET = process.env.PUBLIC_PATH_SECRET;

const UPSTREAMS = {
  judilibre: process.env.JUDILIBRE_UPSTREAM || "https://mcp-legal-fr-judilibre.onrender.com/mcp",
  droit: process.env.DROIT_FRANCAIS_UPSTREAM || "https://mcp-droit-francais-q6lk.onrender.com/mcp"
};

if (!TOKEN) {
  throw new Error("Missing MCP_ACCESS_TOKEN environment variable");
}

if (!PATH_SECRET) {
  throw new Error("Missing PUBLIC_PATH_SECRET environment variable");
}

async function proxyRequest(request, upstreamUrl, search) {
  const target = new URL(upstreamUrl);
  target.search = search;
  const headers = new Headers(request.headers);
  headers.set("authorization", `Bearer ${TOKEN}`);
  headers.delete("host");
  headers.delete("content-length");

  const init = {
    method: request.method,
    headers,
    redirect: "manual"
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = request.body;
    init.duplex = "half";
  }

  const upstream = await fetch(target, init);
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders
  });
}

const http = await import("node:http");

http.createServer(async (req, res) => {
  try {
    const origin = `http://${req.headers.host || "localhost"}`;
    const url = new URL(req.url || "/", origin);

    if (url.pathname === "/health") {
      const body = JSON.stringify({ ok: true });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(body);
      return;
    }

    const match = url.pathname.match(/^\/([^/]+)\/(judilibre|droit)\/mcp\/?$/);
    if (!match || match[1] !== PATH_SECRET) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request(url.href, {
      method: req.method,
      headers: req.headers,
      body,
      duplex: body ? "half" : undefined
    });

    const upstreamResponse = await proxyRequest(request, UPSTREAMS[match[2]], url.search);
    res.writeHead(upstreamResponse.status, Object.fromEntries(upstreamResponse.headers));

    if (upstreamResponse.body) {
      for await (const chunk of upstreamResponse.body) {
        res.write(Buffer.from(chunk));
      }
    }
    res.end();
  } catch (error) {
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end(error instanceof Error ? error.message : "Proxy error");
  }
}).listen(PORT, () => {
  console.log(`MCP proxy listening on ${PORT}`);
});
