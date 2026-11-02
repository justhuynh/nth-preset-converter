export const config = {
  runtime: "edge",
};

const UPSTREAM_ORIGIN = "https://103.101.163.27:8443";
const SPOOF_ORIGIN = "https://nth-qrcode-converter.pages.dev";

export default async function handler(request) {
  const url = new URL(request.url);
  const upstreamUrl = UPSTREAM_ORIGIN + url.pathname + url.search;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
      },
    });
  }

  const headers = new Headers(request.headers);
  headers.set("Origin", SPOOF_ORIGIN);
  headers.set("Referer", `${SPOOF_ORIGIN}/`);

  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
  });

  const resHeaders = new Headers(response.headers);
  resHeaders.set("Access-Control-Allow-Origin", "*");
  resHeaders.delete("content-security-policy");
  resHeaders.delete("x-frame-options");

  return new Response(response.body, {
    status: response.status,
    headers: resHeaders,
  });
}
