// Facebook Graph API — https://developers.facebook.com/docs/pages-api/posts
// FACEBOOK_PAGE_ACCESS_TOKEN must be a long-lived Page access token (not a
// user token) for the page FACEBOOK_PAGE_ID identifies.
export async function postToFacebook(message, link) {
  if (!process.env.FACEBOOK_PAGE_ID || !process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    return { ok: false, error: "Facebook not configured" };
  }
  const params = new URLSearchParams({ message, access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN });
  if (link) params.set("link", link);
  const res = await fetch(`https://graph.facebook.com/v19.0/${process.env.FACEBOOK_PAGE_ID}/feed`, {
    method: "POST",
    body: params,
  });
  if (!res.ok) return { ok: false, error: await res.text() };
  return { ok: true };
}
