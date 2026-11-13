import { requireUser } from "../../../../lib/supabaseAdmin";
import { APPLICATION_STATUSES } from "../../../../lib/applicationStatus";

// POST { id, status } — moves one of the signed-in user's applications along
// the tracker (tailored → applied → interview → offer, or not this time).
// Applications are read-only to the browser (RLS), so the update runs here
// with the service role, scoped to the caller's own row.
export async function POST(req) {
  const authed = await requireUser(req);
  if (!authed) return Response.json({ error: "Please sign in.", code: "auth" }, { status: 401 });
  const { user, admin } = authed;

  const { id, status } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || !APPLICATION_STATUSES.some((s) => s.value === status)) {
    return Response.json({ error: "Unknown application or status." }, { status: 400 });
  }

  const { data: row, error } = await admin
    .from("generations")
    .select("id, result")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error || !row) return Response.json({ error: "Application not found." }, { status: 404 });

  const now = new Date().toISOString();
  const tracking = {
    ...(row.result?.tracking || {}),
    status,
    updatedAt: now,
    ...(status === "applied" && !row.result?.tracking?.appliedAt ? { appliedAt: now } : {}),
  };
  const { error: upErr } = await admin
    .from("generations")
    .update({ result: { ...row.result, tracking } })
    .eq("id", id)
    .eq("user_id", user.id);
  if (upErr) {
    console.error("applications/status: update failed:", upErr);
    return Response.json({ error: "Couldn't save that. Try again." }, { status: 500 });
  }
  return Response.json({ tracking });
}
