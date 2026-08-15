// Meta WhatsApp Cloud API — https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
// Requires a WhatsApp Business app + a verified phone number in Meta's developer console.
export async function sendWhatsapp({ to, message }) {
  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return { ok: false, error: "WhatsApp Cloud API not configured" };
  }
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: message } }),
    }
  );
  if (!res.ok) return { ok: false, error: await res.text() };
  return { ok: true };
}
