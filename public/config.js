"use strict";
window.NTH_QR_CONFIG = Object.freeze({
  apiBase:
    typeof location !== "undefined" && /^https?:$/.test(location.protocol)
      ? location.origin
      : "https://103.101.163.27:8443",
  upstreamApiBase: "https://103.101.163.27:8443"
});
