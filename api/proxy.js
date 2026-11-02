const UPSTREAM_HOST = "103.101.163.27";
const UPSTREAM_PORT = 8443;
const UPSTREAM_ORIGIN = `https://${UPSTREAM_HOST}:${UPSTREAM_PORT}`;
const SPOOF_ORIGIN = "https://nth-qrcode-converter.pages.dev";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  // Extract path from query or fallback to req.url
  let targetPath = req.query._path || req.url;
  // If query string was present, append remaining query parameters
  const urlObj = new URL(req.url, "http://localhost");
  urlObj.searchParams.delete("_path");
  const extraSearch = urlObj.searchParams.toString();
  if (extraSearch) {
    targetPath += (targetPath.includes("?") ? "&" : "?") + extraSearch;
  }

  const upstreamUrl = `${UPSTREAM_ORIGIN}${targetPath}`;

  try {
    const headers = { ...req.headers };
    delete headers.host;
    headers["origin"] = SPOOF_ORIGIN;
    headers["referer"] = `${SPOOF_ORIGIN}/`;

    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      fetchOptions.body = typeof req.body === "object" ? JSON.stringify(req.body) : req.body;
    }

    const response = await fetch(upstreamUrl, fetchOptions);

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key !== "content-security-policy" && key !== "x-frame-options") {
        res.setHeader(key, value);
      }
    });

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(502).json({ error: "Upstream error", message: err.message });
  }
}
