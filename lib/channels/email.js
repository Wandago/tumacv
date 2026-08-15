// Resend REST API — https://resend.com/docs/api-reference/emails/send-email
export async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY not set" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MARKETING_FROM_EMAIL || "TumaCV <hello@tumacv.vercel.app>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) return { ok: false, error: await res.text() };
  return { ok: true };
}
