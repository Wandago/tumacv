// Africa's Talking bulk SMS API — https://developers.africastalking.com/docs/sms/sending/bulk
// AFRICASTALKING_USERNAME of "sandbox" routes to their sandbox host for testing.
export async function sendSms({ to, message }) {
  if (!process.env.AFRICASTALKING_API_KEY || !process.env.AFRICASTALKING_USERNAME) {
    return { ok: false, error: "Africa's Talking not configured" };
  }
  const base =
    process.env.AFRICASTALKING_USERNAME === "sandbox"
      ? "https://api.sandbox.africastalking.com"
      : "https://api.africastalking.com";
  const res = await fetch(`${base}/version1/messaging`, {
    method: "POST",
    headers: {
      apikey: process.env.AFRICASTALKING_API_KEY,
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body: new URLSearchParams({
      username: process.env.AFRICASTALKING_USERNAME,
      to: `+${to}`,
      message,
    }),
  });
  if (!res.ok) return { ok: false, error: await res.text() };
  return { ok: true };
}
