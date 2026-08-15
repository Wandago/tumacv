// LinkedIn UGC Posts API — https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/ugc-post-api
// LINKEDIN_ORG_URN is the Company Page posting as, e.g. "urn:li:organization:12345678".
// LINKEDIN_ACCESS_TOKEN needs the w_organization_social scope from a LinkedIn app
// tied to that page, and LinkedIn access tokens expire (~60 days) — this does not
// handle refresh, so plan to rotate the env var manually.
export async function postToLinkedIn(text, ctaUrl) {
  if (!process.env.LINKEDIN_ACCESS_TOKEN || !process.env.LINKEDIN_ORG_URN) {
    return { ok: false, error: "LinkedIn not configured" };
  }
  const body = {
    author: process.env.LINKEDIN_ORG_URN,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: ctaUrl ? "ARTICLE" : "NONE",
        ...(ctaUrl ? { media: [{ status: "READY", originalUrl: ctaUrl }] } : {}),
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
      "content-type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return { ok: false, error: await res.text() };
  return { ok: true };
}
