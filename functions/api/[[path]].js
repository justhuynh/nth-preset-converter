export async function onRequest(context) {
  const url = new URL(context.request.url);
  const upstreamUrl = "https://103.101.163.27:8443" + url.pathname + url.search;

  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept"
      }
    });
  }

  const headers = new Headers(context.request.headers);
  headers.delete("Origin");
  headers.delete("Referer");

  const response = await fetch(upstreamUrl, {
    method: context.request.method,
    headers,
    body: context.request.method === "GET" || context.request.method === "HEAD" ? undefined : context.request.body
  });

  const resHeaders = new Headers(response.headers);
  resHeaders.set("Access-Control-Allow-Origin", "*");
  resHeaders.delete("content-security-policy");
  resHeaders.delete("x-frame-options");

  return new Response(response.body, {
    status: response.status,
    headers: resHeaders
  });
}
