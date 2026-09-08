export default {
  async fetch(request, env) {
    const upgrade = request.headers.get("Upgrade");

    // Health check / normal HTTP request
    if (!upgrade || upgrade.toLowerCase() !== "websocket") {
      return new Response("Trendify Worker OK", {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      });
    }

    const incoming = new URL(request.url);

    // Only VLESS WebSocket endpoint
    if (incoming.pathname !== "/vless") {
      return new Response("Not Found", {
        status: 404
      });
    }

    // Railway public URL
    if (!env.RAILWAY_URL) {
      return new Response("RAILWAY_URL is not configured", {
        status: 500
      });
    }

    let target;

    try {
      target = new URL(env.RAILWAY_URL);
    } catch {
      return new Response("Invalid RAILWAY_URL", {
        status: 500
      });
    }

    // Force the VLESS WebSocket path
    target.pathname = "/vless";
    target.search = incoming.search;

    // Preserve the correct protocol
    if (target.protocol === "https:") {
      target.protocol = "wss:";
    } else if (target.protocol === "http:") {
      target.protocol = "ws:";
    } else {
      return new Response("RAILWAY_URL must use http or https", {
        status: 500
      });
    }

    const proxyRequest = new Request(target.toString(), request);

    return fetch(proxyRequest);
  }
};
