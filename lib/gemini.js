// Ordered by cost: Flash-Lite is ~15x cheaper than 3.6 Flash and is what the
// pricing in lib/plans.js is built around. Falls forward on 404 (model
// renamed/retired), 503 (temporarily overloaded), and 429 (rate limited) —
// these are all cases where a different model has a real chance of working.
// Anything else (bad request, auth failure) surfaces immediately since
// retrying with another model wouldn't help.
const MODEL_CANDIDATES = ["gemini-2.5-flash-lite", "gemini-3.5-flash-lite", "gemini-3.6-flash"];
const RETRYABLE_STATUSES = new Set([404, 503, 429]);

export async function callGemini(body) {
  let lastDetail = "";
  let lastStatus = 502;
  for (const model of MODEL_CANDIDATES) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (res.ok) return res;
    lastDetail = await res.text();
    lastStatus = res.status;
    if (!RETRYABLE_STATUSES.has(res.status)) {
      console.error(`Gemini error (${model}):`, lastDetail);
      return { ok: false, status: res.status, _detail: lastDetail };
    }
    console.error(`Gemini model unavailable (${res.status}), trying next: ${model}`);
  }
  console.error("All Gemini model candidates failed:", lastDetail);
  return { ok: false, status: lastStatus === 429 ? 429 : 502, _detail: lastDetail };
}
