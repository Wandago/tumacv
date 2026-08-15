import crypto from "crypto";

// X (Twitter) API v2 — https://developer.x.com/en/docs/x-api/tweets/manage-tweets/api-reference/post-tweets
// Posting requires OAuth 1.0a user-context signing (app + access token/secret,
// both from a Project/App with write permission) — there is no simpler
// server-to-server auth for posting on someone's behalf.
function percentEncode(str) {
  return encodeURIComponent(str).replace(/[!*'()]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function oauthHeader({ method, url }) {
  const oauthParams = {
    oauth_consumer_key: process.env.X_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: process.env.X_ACCESS_TOKEN,
    oauth_version: "1.0",
  };
  const paramString = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join("&");
  const baseString = `${method}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(process.env.X_API_SECRET)}&${percentEncode(process.env.X_ACCESS_SECRET)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
  const headerParams = { ...oauthParams, oauth_signature: signature };
  return "OAuth " + Object.keys(headerParams).sort().map((k) => `${percentEncode(k)}="${percentEncode(headerParams[k])}"`).join(", ");
}

export async function postToX(text) {
  if (!process.env.X_API_KEY || !process.env.X_API_SECRET || !process.env.X_ACCESS_TOKEN || !process.env.X_ACCESS_SECRET) {
    return { ok: false, error: "X API credentials not configured" };
  }
  const url = "https://api.twitter.com/2/tweets";
  const res = await fetch(url, {
    method: "POST",
    headers: { authorization: oauthHeader({ method: "POST", url }), "content-type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 280) }),
  });
  if (!res.ok) return { ok: false, error: await res.text() };
  return { ok: true };
}
