import { inflateRaw } from "zlib";
const b64 = "fZJPj9MwEMW/SuS74/xpU9ZqKpWtEJUWqLaFw15WE2dKLBw7eCbAfnvUhErl0pM149+T3/PMmqB3g96O3Pn/DkicfKnd570dFGLMXodgCxpDz2SZqOP209PukgzPcTAwQQnbiT3FUCEkW3wItnvavEKqxLzyqBcvmtKuSiWuYSlQfnQtA/ZYlWUVXUWyTeMZIOvRZFmItkTjbj3xOC5FkVWVDJbyWx1ykudV3pRpIsqfxHJDomtB56UHfNAWikYuUvNW4OxxXNqjIoIrid1balrJnUJI5LDv/K99a313++na2aI9MfT6SAPX44nkWyviR+Dp7HHeMT4yxr8+vw0u9JKuWDAdYFYl1mWKRjs5FMRhclGoQw414D5ocKAnjqLrpWTwc36cujpT+KGkVjeIC1Q1wSIM7xWt+x6nvxn6HG/OwRnzVvyIcQe+H7IS8e28jyheriMhhg9i2TrXPj9GBEYa8FxRKE285v/L9jmLw==";
const buf = Buffer.from(b64, "base64");
inflateRaw(buf, (err, inflated) => {
  if (err) { console.error("Inflate error:", err.message); return; }
  console.log(inflated.toString("utf-8"));
});
