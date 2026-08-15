import { callGemini } from "./gemini";
import { FREE_MODE } from "./plans";
import { CHANNEL_STATUS } from "./marketingChannels";
import { sendEmail } from "./channels/email";
import { sendSms } from "./channels/sms";
import { sendWhatsapp } from "./channels/whatsapp";
import { postToX } from "./channels/x";
import { postToLinkedIn } from "./channels/linkedin";
import { postToFacebook } from "./channels/facebook";

const SITE_URL = "https://tumacv.vercel.app";
const BATCH_SIZE = 25;
const DM_COOLDOWN_DAYS = 14;
const INACTIVE_DAYS = 7;

function todayStartIso() {
  return new Date(new Date().toISOString().slice(0, 10)).toISOString();
}

function extractJson(res) {
  return res.json().then((data) => {
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    try {
      return JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      return null;
    }
  });
}

// --- Social posts + in-app banner ------------------------------------------

async function todaysArticle(admin) {
  const { data } = await admin
    .from("articles")
    .select("id, title")
    .gte("created_at", todayStartIso())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

async function generateSocialCopy(article) {
  const subject = article
    ? `today's new TumaCV article, "${article.title}" (link: ${SITE_URL}/news/${article.id})`
    : `TumaCV itself — free AI-tailored CVs and cover letters for Kenyan job seekers, 5 free applications on signup, plus a referral program that gives bonus credits`;

  const prompt = `You write sharp, non-cringe marketing copy for TumaCV, an app that tailors CVs and cover letters to a specific job posting for job seekers in Kenya (free to start, M-Pesa/Airtel top-ups).

Write promotional copy about ${subject}.

Hard rules:
- No hype clichés ("game-changer", "revolutionize", "unlock your potential"). Write like a real person recommending something useful.
- Be concrete about the benefit, not vague ("get a CV that actually matches the job description" beats "boost your career").
- Each platform's copy must fit that platform's norms and length.
- Do not fabricate statistics, testimonials, or quotes.

Respond as JSON only:
{
  "x": "under 240 characters, punchy, 0-2 hashtags max",
  "linkedin": "2-4 short sentences, professional but human tone, no emoji spam",
  "facebook": "2-3 friendly sentences, at most 1 emoji",
  "inApp": "one short sentence, under 120 characters, for a banner shown to logged-in users"
}`;

  const res = await callGemini({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 500, responseMimeType: "application/json" },
  });
  if (!res.ok) return null;
  const parsed = await extractJson(res);
  if (!parsed?.x || !parsed.linkedin || !parsed.facebook || !parsed.inApp) return null;
  return parsed;
}

async function generateSocialContent(admin) {
  const { count } = await admin
    .from("marketing_content")
    .select("id", { count: "exact", head: true })
    .eq("kind", "social_post")
    .gte("created_at", todayStartIso());
  if (count > 0) return { generated: false, reason: "already generated today" };

  const article = await todaysArticle(admin);
  const copy = await generateSocialCopy(article);
  if (!copy) return { generated: false, reason: "content generation failed" };

  const ctaUrl = article ? `${SITE_URL}/news/${article.id}` : SITE_URL;
  const rows = [
    { kind: "social_post", channel: "x", body: copy.x, cta_url: ctaUrl },
    { kind: "social_post", channel: "linkedin", body: copy.linkedin, cta_url: ctaUrl },
    { kind: "social_post", channel: "facebook", body: copy.facebook, cta_url: ctaUrl },
    { kind: "in_app", channel: "in_app", body: copy.inApp, cta_url: ctaUrl },
  ];
  const { error } = await admin.from("marketing_content").insert(rows);
  if (error) return { generated: false, reason: error.message };
  return { generated: true, hadArticle: !!article };
}

const SOCIAL_SENDERS = {
  x: (row) => postToX(row.body),
  linkedin: (row) => postToLinkedIn(row.body, row.cta_url),
  facebook: (row) => postToFacebook(row.body, row.cta_url),
};

async function distributePending(admin) {
  const { data: pending } = await admin
    .from("marketing_content")
    .select("*")
    .in("kind", ["social_post", "in_app"])
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(20);

  let sent = 0, failed = 0, skipped = 0;
  for (const row of pending || []) {
    if (row.kind === "in_app") {
      await admin.from("marketing_content").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", row.id);
      sent++;
      continue;
    }
    if (!CHANNEL_STATUS[row.channel]) {
      await admin.from("marketing_content").update({ status: "skipped", error: "channel not configured" }).eq("id", row.id);
      skipped++;
      continue;
    }
    const send = SOCIAL_SENDERS[row.channel];
    const result = send ? await send(row) : { ok: false, error: "no sender for channel" };
    if (result.ok) {
      await admin.from("marketing_content").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", row.id);
      sent++;
    } else {
      await admin.from("marketing_content").update({ status: "failed", error: String(result.error).slice(0, 500) }).eq("id", row.id);
      failed++;
    }
  }
  return { sent, failed, skipped };
}

// --- Lifecycle DMs -----------------------------------------------------

const SEGMENTS = {
  winback: {
    label: "Inactive 7+ days",
    angle: "gently invite them back — they haven't generated an application in over a week. Remind them any free applications they still have don't expire, and mention they can invite a friend to earn more free credits.",
  },
  low_credits: {
    label: "Down to their last application or two",
    angle: "let them know they're running low, and mention both ways to get more: topping up (M-Pesa/Airtel Money) or inviting a friend for free bonus credits.",
  },
};

async function todaysTemplate(admin, segment) {
  const { data } = await admin
    .from("marketing_content")
    .select("subject, body")
    .eq("kind", "lifecycle_email")
    .eq("segment", segment)
    .is("recipient_user_id", null)
    .gte("created_at", todayStartIso())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

async function generateLifecycleTemplate(admin, segmentKey) {
  const segment = SEGMENTS[segmentKey];
  const prompt = `You write short, warm re-engagement emails for TumaCV, an app that tailors CVs and cover letters to job postings for job seekers in Kenya.

Audience: ${segment.label}. Goal: ${segment.angle}

Hard rules:
- Warm and direct, not salesy or desperate — a helpful note, not an ad.
- Under 110 words for the body.
- No fabricated stats or claims.
- Sign off as "— The TumaCV team" on its own line.

Respond as JSON only: {"subject": "under 60 characters", "body": "plain text, paragraphs separated by \\n\\n"}`;

  const res = await callGemini({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 400, responseMimeType: "application/json" },
  });
  if (!res.ok) return null;
  const parsed = await extractJson(res);
  if (!parsed?.subject || !parsed.body) return null;
  return parsed;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function emailHtml(body) {
  const paragraphs = body
    .split("\n\n")
    .map((p) => `<p style="font-size:14px; line-height:1.6; color:#5c5a54; margin:0 0 14px;">${escapeHtml(p)}</p>`)
    .join("");
  return `<div style="background:#fafaf7; padding:32px 16px; font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e8e6df;">
    <tr><td style="height:4px; background:linear-gradient(90deg,#0b7a3b,#e2372b); font-size:0; line-height:0;">&nbsp;</td></tr>
    <tr><td style="padding:36px 36px 8px;"><div style="font-size:22px; font-weight:800; letter-spacing:-0.02em; color:#14181a;">Tuma<span style="color:#0b7a3b;">CV</span></div></td></tr>
    <tr><td style="padding:8px 36px 24px;">${paragraphs}</td></tr>
    <tr><td style="padding:0 36px 32px;">
      <a href="${SITE_URL}/dashboard" style="display:inline-block; background:#0b7a3b; color:#ffffff; text-decoration:none; font-weight:600; font-size:14px; padding:12px 20px; border-radius:8px;">Open TumaCV</a>
    </td></tr>
    <tr><td style="padding:20px 36px 32px; border-top:1px solid #e8e6df;">
      <p style="font-size:11px; color:#8a8880; margin:0;">Don't want these? <a href="${SITE_URL}/dashboard" style="color:#0b7a3b;">Turn off marketing messages</a> in your dashboard.</p>
    </td></tr>
  </table>
</div>`;
}

async function eligibleUsers(admin, segmentKey) {
  const cooldownIso = new Date(Date.now() - DM_COOLDOWN_DAYS * 86400000).toISOString();
  let query = admin
    .from("profiles")
    .select("id, email, phone, credits")
    .eq("onboarded", true)
    .eq("marketing_opt_out", false)
    .eq("banned", false)
    .or(`last_marketing_dm_at.is.null,last_marketing_dm_at.lt.${cooldownIso}`)
    .limit(BATCH_SIZE);

  if (segmentKey === "winback") {
    const inactiveIso = new Date(Date.now() - INACTIVE_DAYS * 86400000).toISOString().slice(0, 10);
    query = query.or(`last_generation_date.is.null,last_generation_date.lt.${inactiveIso}`);
  } else if (segmentKey === "low_credits") {
    query = query.lte("credits", 1);
  }

  const { data } = await query;
  return data || [];
}

async function runLifecycleSegment(admin, segmentKey) {
  if (segmentKey === "low_credits" && FREE_MODE) {
    return { segment: segmentKey, sent: 0, reason: "skipped — FREE_MODE, credits aren't meaningful right now" };
  }

  let template = await todaysTemplate(admin, segmentKey);
  if (!template) {
    template = await generateLifecycleTemplate(admin, segmentKey);
    if (!template) return { segment: segmentKey, sent: 0, reason: "content generation failed" };
    // Log the template itself once, as a record of what was generated today
    // (not a send — recipient_user_id stays null).
    await admin.from("marketing_content").insert({
      kind: "lifecycle_email", channel: "email", segment: segmentKey,
      subject: template.subject, body: template.body, status: "skipped", error: "template, not a send",
    });
  }

  const users = await eligibleUsers(admin, segmentKey);
  let sent = 0, failed = 0;
  for (const user of users) {
    const attempts = [];
    if (CHANNEL_STATUS.email && user.email) {
      attempts.push(["email", () => sendEmail({ to: user.email, subject: template.subject, html: emailHtml(template.body) })]);
    }
    if (CHANNEL_STATUS.whatsapp && user.phone) {
      attempts.push(["whatsapp", () => sendWhatsapp({ to: user.phone, message: `${template.subject}\n\n${template.body}` })]);
    }
    if (CHANNEL_STATUS.sms && user.phone) {
      attempts.push(["sms", () => sendSms({ to: user.phone, message: template.body.slice(0, 300) })]);
    }
    if (attempts.length === 0) continue;

    let anySent = false;
    for (const [channel, send] of attempts) {
      const result = await send();
      await admin.from("marketing_content").insert({
        kind: "lifecycle_email", channel, segment: segmentKey, recipient_user_id: user.id,
        subject: template.subject, body: template.body,
        status: result.ok ? "sent" : "failed",
        error: result.ok ? null : String(result.error).slice(0, 500),
        sent_at: result.ok ? new Date().toISOString() : null,
      });
      if (result.ok) anySent = true;
    }
    if (anySent) {
      await admin.from("profiles").update({ last_marketing_dm_at: new Date().toISOString() }).eq("id", user.id);
      sent++;
    } else {
      failed++;
    }
  }
  return { segment: segmentKey, sent, failed, eligible: users.length };
}

// --- Orchestrator --------------------------------------------------------

export async function runMarketingCron(admin) {
  const social = await generateSocialContent(admin);
  const distributed = await distributePending(admin);
  const winback = await runLifecycleSegment(admin, "winback");
  const lowCredits = await runLifecycleSegment(admin, "low_credits");
  return { social, distributed, winback, lowCredits };
}
