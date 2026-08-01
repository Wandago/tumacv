import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { INDUSTRIES } from "../../../../lib/gamification";
import { callGemini } from "../../../../lib/gemini";

export const maxDuration = 60;

async function generateOne(industry) {
  const res = await callGemini({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Write a short career-insights article (250-350 words) for Kenyan job seekers in the ${industry} industry. Cover: current hiring trends, in-demand skills, and one practical tip for standing out in applications. Plain, direct, no fluff, no markdown headers — just paragraphs. Respond as JSON only: {"title": "...", "content": "..."}`,
          },
        ],
      },
    ],
    generationConfig: { maxOutputTokens: 900, responseMimeType: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (!parsed.title || !parsed.content) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function GET(req) {
  const url = new URL(req.url);
  const provided = url.searchParams.get("secret") || req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("authorization"); // Vercel Cron sends this automatically
  const authorized =
    (process.env.CRON_SECRET && provided === process.env.CRON_SECRET) ||
    (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`);
  if (!authorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
  }

  const admin = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const results = [];

  for (const industry of INDUSTRIES) {
    if (industry === "Other") continue; // not a real "industry" to write about
    const { data: existing } = await admin
      .from("articles")
      .select("id, created_at")
      .eq("industry", industry)
      .gte("created_at", `${today}T00:00:00Z`)
      .limit(1);
    if (existing && existing.length > 0) {
      results.push({ industry, skipped: "already generated today" });
      continue;
    }
    const article = await generateOne(industry);
    if (!article) {
      results.push({ industry, error: true });
      continue;
    }
    await admin.from("articles").insert({ industry, title: article.title, content: article.content });
    results.push({ industry, created: true });
  }

  return Response.json({ ok: true, results });
}
