import { json } from "./http.js";

/**
 * Returns a 401 Response if the request is not authorized as admin,
 * or null when it is. The password lives in the ADMIN_PASSWORD secret.
 */
export function requireAdmin(request, env) {
  const header = request.headers.get("Authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!env.ADMIN_PASSWORD || !safeEqual(token, env.ADMIN_PASSWORD)) {
    return json({ error: "Unauthorized" }, 401);
  }
  return null;
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
