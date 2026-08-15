import { requireUser } from "../../../lib/supabaseAdmin";

export const maxDuration = 10;

export async function GET(req) {
  const authed = await requireUser(req);
  if (!authed) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { user, admin } = authed;

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", user.id)
    .eq("referral_credited", true);

  return Response.json({ count: count || 0 });
}
