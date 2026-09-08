import https from "node:https";
import http from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const host = process.env.DEMO_HTTPS_HOST || "192.168.197.87";
const port = Number(process.env.DEMO_HTTPS_PORT || 3443);
const targetPort = Number(process.env.DEMO_HTTP_PORT || 3002);
const targetHost = process.env.DEMO_HTTP_HOST || host;
const certificateDir = join(process.cwd(), ".local", "https");

const server = https.createServer(
  {
    key: readFileSync(join(certificateDir, "server.key")),
    cert: readFileSync(join(certificateDir, "server.crt")),
  },
  (request, response) => {
    const proxy = http.request(
      {
        hostname: targetHost,
        port: targetPort,
        path: request.url,
        method: request.method,
        headers: {
          ...request.headers,
          "x-forwarded-proto": "https",
          "x-forwarded-host": request.headers.host || `${host}:${port}`,
        },
      },
      (upstream) => {
        response.writeHead(upstream.statusCode || 502, upstream.headers);
        upstream.pipe(response);
      },
    );
    proxy.on("error", () => {
      if (!response.headersSent) response.writeHead(502);
      response.end("Local demo server is unavailable.");
    });
    request.pipe(proxy);
  },
);

server.listen(port, host, () => {
  console.log(`HTTPS demo proxy listening on https://${host}:${port}`);
});
