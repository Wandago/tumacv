// Ordered by cost: Flash-Lite is ~15x cheaper than 3.6 Flash and is what the
// pricing in lib/plans.js is built around. Falls forward only on 404 (a model
// being renamed/retired) — not on quota/auth errors, which surface immediately.
const MODEL_CANDIDATES = ["gemini-2.5-flash-lite", "gemini-3.5-flash-lite", "gemini-3.6-flash"];

export async function callGemini(body) {
  let lastDetail = "";
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
    if (res.status !== 404) {
      console.error(`Gemini error (${model}):`, lastDetail);
      return { ok: false, status: res.status, _detail: lastDetail };
    }
    console.error(`Gemini model unavailable, trying next: ${model}`);
  }
  console.error("All Gemini model candidates failed:", lastDetail);
  return { ok: false, status: 502, _detail: lastDetail };
}
