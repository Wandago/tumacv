// Single source of truth for which marketing channels are live. A channel
// turns on the moment its env vars are set — no code change needed. See
// README's "Marketing engine" section for where to get each credential.
export const CHANNEL_STATUS = {
  email: !!process.env.RESEND_API_KEY,
  whatsapp: !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
  sms: !!(process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME),
  x: !!(process.env.X_API_KEY && process.env.X_API_SECRET && process.env.X_ACCESS_TOKEN && process.env.X_ACCESS_SECRET),
  linkedin: !!(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_ORG_URN),
  facebook: !!(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_ACCESS_TOKEN),
  // Not wired: none of these three have a way to publish an organic,
  // text-only post from a server without extra work this app doesn't do yet.
  instagram: false,
  tiktok: false,
  snapchat: false,
};

export const CHANNEL_LABELS = {
  email: "Email", whatsapp: "WhatsApp", sms: "SMS",
  x: "X", linkedin: "LinkedIn", facebook: "Facebook",
  instagram: "Instagram", tiktok: "TikTok", snapchat: "Snapchat",
  in_app: "In-app",
};

export const UNSUPPORTED_REASON = {
  instagram: "Instagram's Graph API can't publish a text-only post — it needs an image or video asset pipeline this app doesn't build yet.",
  tiktok: "TikTok's Content Posting API only accepts video, and requires a separate app-review process — not wired.",
  snapchat: "Snapchat has no public API for organic posting from a regular account, only paid ads — not wired.",
};

export const SOCIAL_CHANNELS = ["x", "linkedin", "facebook", "instagram", "tiktok", "snapchat"];
export const DM_CHANNELS = ["email", "whatsapp", "sms"];
