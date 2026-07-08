import { createRequire } from "node:module";
import { promisify } from "node:util";
import { inflateRaw, deflateRaw } from "node:zlib";

// The SAMLRequest from the URL (URL-decoded base64)
const b64 = "fZJPj9MwEMW/SuS74/xpU9ZqKpWtEJUWqLaFw15WE2dKLBw7eCbAfnvUhErl0pM149+T3/PMmqB3g96O3Pn/DkicfKnd570dFGLMXodgCxpDz2SZqOP209PukgzPcTAwQQnbiT3FUCEkW3wItnvavEKqxLzyqBcvmtKuSiWuYSlQfnQtA/ZYlWUVXUWyTeMZIOvRZFmItkTjbj3xOC5FkVWVDJbyWx1ykudV3pRpIsqfxHJDomtB56UHfNAWikYuUvNW4OxxXNqjIoIrid1balrJnUJI5LDv/K99a313++na2aI9MfT6SAPX44nkWyviR+Dp7HHeMT4yxr8+vw0u9JKuWDAdYFYl1mWKRjs5FMRhclGoQw414D5ocKAnjqLrpWTwc36cujpT+KGkVjeIC1Q1wSIM7xWt+x6nvxn6HG/OwRnzVvyIcQe+H7IS8e28jyheriMhhg9i2TrXPj9GBEYa8FxRKE285v/L9jmLw==";
const buf = Buffer.from(b64, "base64");

console.log("First bytes (hex):", buf.slice(0, 10).toString("hex"));
console.log("First bytes (ascii):", buf.slice(0, 20).toString("ascii").replace(/[\x00-\x1f]/g, "."));

// Try different zlib approaches
const inflateP = promisify(inflateRaw);
const zlib = await import("node:zlib");

// Method 1: raw deflate (no header)
try {
  const result = await promisify(zlib.inflateRaw)(buf);
  console.log("=== inflateRaw success ===");
  console.log(result.toString("utf-8"));
  process.exit(0);
} catch (e) {
  console.log("inflateRaw failed:", e.message);
}

// Method 2: zlib inflate (with header)
try {
  const result = await promisify(zlib.inflate)(buf);
  console.log("=== inflate success ===");
  console.log(result.toString("utf-8"));
  process.exit(0);
} catch (e) {
  console.log("inflate failed:", e.message);
}

// Method 3: gunzip
try {
  const result = await promisify(zlib.gunzip)(buf);
  console.log("=== gunzip success ===");
  console.log(result.toString("utf-8"));
  process.exit(0);
} catch (e) {
  console.log("gunzip failed:", e.message);
}

// Method 4: Maybe it's not compressed, just check if it's XML directly
try {
  const text = buf.toString("utf-8");
  if (text.includes("AuthnRequest") || text.includes("samlp")) {
    console.log("=== raw text ===");
    console.log(text);
    process.exit(0);
  }
} catch (e) {}

console.log("All methods failed. The SAML request might use a different compression.");
