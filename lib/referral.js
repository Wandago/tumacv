// First-touch referral attribution: whichever ?ref= code a visitor lands
// with first is remembered until they sign up, even if they browse other
// pages or come back later before creating an account.
const REF_KEY = "tumacv-ref";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidReferralCode(code) {
  return typeof code === "string" && UUID_RE.test(code);
}

export function storeReferralCodeIfNew(code) {
  if (!isValidReferralCode(code)) return;
  try {
    if (!localStorage.getItem(REF_KEY)) localStorage.setItem(REF_KEY, code);
  } catch {}
}

export function getStoredReferralCode() {
  try {
    return localStorage.getItem(REF_KEY) || "";
  } catch {
    return "";
  }
}

export function clearStoredReferralCode() {
  try {
    localStorage.removeItem(REF_KEY);
  } catch {}
}

export function referralLink(userId) {
  return `https://tumacv.vercel.app/?ref=${userId}`;
}
