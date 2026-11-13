// Ordered by cost: Flash-Lite is what the pricing in lib/plans.js is built
// around. gemini-2.5-flash-lite used to lead this list, but Google now limits
// it to existing API users — a newer key gets refused outright — so it's
// kept only as a last resort.
//
// Every 3.x model thinks by default, and thinking tokens count against
// maxOutputTokens: left at the default, a long CV could spend its whole
// output budget reasoning and come back truncated or empty. Each 3.x model
// gets the lowest thinking level it accepts. 2.5-flash-lite doesn't think by
// default and rejects thinkingLevel, so it gets no thinking config.
const MODEL_CANDIDATES = [
  { model: "gemini-3.5-flash-lite", thinkingLevel: "minimal" },
  { model: "gemini-3.1-flash-lite", thinkingLevel: "minimal" },
  { model: "gemini-3.6-flash", thinkingLevel: "low" },
  { model: "gemini-2.5-flash-lite" },
];

// Leaves headroom inside a 60s serverless function (maxDuration) for the
// caller's own database work after the model answers.
const DEFAULT_TIMEOUT_MS = 50_000;

function withThinking(body, thinkingLevel) {
  if (body.generationConfig?.thinkingConfig) return body;
  return {
    ...body,
    generationConfig: { ...body.generationConfig, thinkingConfig: { thinkingLevel } },
  };
}

// Tries each model in turn and returns the first usable response. Falls
// forward on any failure — a retired or access-limited model (404/403), an
// overloaded one (503), a rate limit (429), a network error — since a
// different model has a real chance of working, and a request that's bad for
// every model just fails fast on each.
//
// `validate(data)` is optional: given the parsed response JSON, return true to
// accept it, or a short reason string to reject it and try the next model
// (e.g. output cut off at the token limit, or JSON missing required fields).
// With `validate`, the returned object's json() resolves to the already-read
// data. Without it, the raw fetch Response is returned as-is.
export async function callGemini(body, { validate, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastDetail = "";
  let lastStatus = 502;

  for (const { model, thinkingLevel } of MODEL_CANDIDATES) {
    // If a model rejects the thinking config itself (400), retry it once
    // without — that's the field that broke generation once before.
    const variants = thinkingLevel ? [withThinking(body, thinkingLevel), body] : [body];

    for (const variant of variants) {
      const remaining = deadline - Date.now();
      if (remaining < 3000) {
        console.error("Gemini: out of time before trying", model);
        return { ok: false, status: 504, _detail: lastDetail || "timeout" };
      }

      let res;
      try {
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(variant),
            signal: AbortSignal.timeout(remaining),
          }
        );
      } catch (err) {
        lastDetail = err.message;
        lastStatus = err.name === "TimeoutError" ? 504 : 502;
        console.error(`Gemini request failed (${model}):`, err.message);
        break;
      }

      if (res.ok) {
        if (!validate) return res;
        const data = await res.json();
        const verdict = validate(data);
        if (verdict === true) return { ok: true, status: 200, json: async () => data };
        lastDetail = verdict;
        lastStatus = 502;
        console.error(`Gemini output rejected (${model}): ${verdict}`);
        break;
      }

      lastDetail = await res.text();
      lastStatus = res.status;
      if (res.status === 400 && variant !== body) {
        console.error(`Gemini rejected thinking config (${model}), retrying without:`, lastDetail.slice(0, 300));
        continue;
      }
      console.error(`Gemini error (${model}, ${res.status}), trying next:`, lastDetail.slice(0, 300));
      break;
    }
  }

  console.error("All Gemini model candidates failed:", lastDetail.slice(0, 500));
  return { ok: false, status: lastStatus === 429 ? 429 : lastStatus === 504 ? 504 : 502, _detail: lastDetail };
}
