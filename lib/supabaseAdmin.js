import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

// Adds `delta` to a user's credit balance in a single atomic statement and
// returns { credits, error }. Always use this instead of reading `credits`
// and writing back `credits + delta` — two overlapping requests would both
// read the same starting balance and the second write would drop the first
// grant. Needs supabase-migration-v19.sql. Deltas may be negative; the
// function floors the balance at 0.
export async function addCredits(admin, userId, delta) {
  const { data, error } = await admin.rpc("increment_credits", {
    p_user_id: userId,
    p_delta: delta,
  });
  if (error) return { credits: null, error };
  return { credits: data, error: null };
}

// Verifies the Bearer token from the client and returns { user, admin } or null.
export async function requireUser(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return { user: data.user, admin };
}
