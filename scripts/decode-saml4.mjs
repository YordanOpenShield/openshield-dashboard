// Extract SAMLRequest from the full URL
const url = "https://auth.cyberdef.cc/realms/cyberdef/protocol/saml?SAMLRequest=fZJPj9MwEMW%2FSuS74%2FxpU9ZqKpWtEJUWqLaFw15WE2dKLBw7eCbAfnvUhErl0pM149%2BT3%2FPMmqB3g96O3Pln%2FDkicfKnd570dFGLMXodgCxpDz2SZqOP209PukgzPcTAwQQnbiT3FUCEkW3wItnvavEKqxLzyqBcvmtKuSiWuYSlQfnQtA%2FZYlWUVXUWyTeMZIOvRZFmItkTjbj3xOC5FkVWVDJbyWx1ykudV3pRpIsqfxHJDomtB56UHfNAWikYuUvNW4OxxXNqjIoIrid1balrJnUJI5LDv%2FK99a313%2B%2Bna2aI9MfT6SAPX44nkWyviR%2BDp7HHeMT4yxr8%2Bvw0u9JKuWDAdYFYl1mWKRjs5FMRhclGoQw414D5ocKAnjqLrpWTwc36cujpT%2BKGkVjeIC1Q1wSIM7xWt%2Bx6nvxn6HG%2FOwRnzVvyIcQe%2BH7IS8e28jyheriMhhg9i2TrXPj9GBEYa8FxRKE285v%2FL9jmLw%3D%3D&RelayState=eTkvjzFwpktAzqIE0tcBnQFCwFFJUVjI";

const params = new URL(url).searchParams;
const samlRequestB64 = params.get("SAMLRequest");
console.log("SAMLRequest param:", samlRequestB64?.slice(0, 50) + "...");

const buf = Buffer.from(samlRequestB64, "base64");
console.log("Decoded length:", buf.length);
console.log("First 20 bytes (hex):", buf.slice(0, 20).toString("hex"));
console.log("First 20 bytes (ascii):", buf.slice(0, 20).toString("ascii").replace(/[\x00-\x1f]/g, "."));

// SAML HTTP Redirect binding uses Deflate compression
// The first byte should indicate the compression method
// Try different approaches:

import { inflateRaw, inflate, brotliDecompressSync } from "node:zlib";
import { promisify } from "node:util";

// Standard deflate (zlib wrapper)
try {
  const r = await promisify(inflate)(buf);
  console.log("\n=== inflate (zlib) ===");
  console.log(r.toString("utf-8").slice(0, 500));
  process.exit(0);
} catch (e) {
  console.log("inflate failed:", e.message);
}

// Raw deflate  
try {
  const r = await promisify(inflateRaw)(buf);
  console.log("\n=== inflateRaw ===");
  console.log(r.toString("utf-8").slice(0, 500));
  process.exit(0);
} catch (e) {
  console.log("inflateRaw failed:", e.message);
}

// Maybe it's not compressed at all - check if it's readable XML
const raw = buf.toString("utf-8");
console.log("\n=== raw text (first 200 chars) ===");
console.log(raw.slice(0, 200));
