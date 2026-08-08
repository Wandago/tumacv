import { requireUser } from "../../../lib/supabaseAdmin";
import { callGemini } from "../../../lib/gemini";

export const maxDuration = 30;

export async function GET(req) {
  try {
    const authed = await requireUser(req);
    if (!authed) return Response.json({ error: "Sign in first." }, { status: 401 });
    const { user, admin } = authed;

    const { data: profile } = await admin
      .from("profiles")
      .select("industry, experience_level, cached_insight, insight_date")
      .eq("id", user.id)
      .single();

    if (!profile?.industry) return Response.json({ insight: null });

    const today = new Date().toISOString().slice(0, 10);
    if (profile.cached_insight && profile.insight_date === today) {
      return Response.json({ insight: profile.cached_insight });
    }

    if (!process.env.GEMINI_API_KEY) return Response.json({ insight: null });

    const prompt = `Give one short, specific, actionable job-hunting tip (2-3 sentences, under 60 words) for someone in the ${profile.industry} industry in Kenya${profile.experience_level ? `, at the ${profile.experience_level} level` : ""}. Be concrete — a specific tactic, not generic encouragement. No markdown. Do not invent statistics.`;

    const res = await callGemini({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 200 },
    });

    if (!res.ok) return Response.json({ insight: null });
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim() || null;

    if (text) {
      await admin.from("profiles").update({ cached_insight: text, insight_date: today }).eq("id", user.id);
    }
    return Response.json({ insight: text });
  } catch (err) {
    console.error(err);
    return Response.json({ insight: null });
  }
}
