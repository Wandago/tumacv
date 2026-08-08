import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export const maxDuration = 20;

export async function POST(req) {
  try {
    const { type, message, email } = await req.json();
    const trimmed = (message || "").trim();
    if (trimmed.length < 10) {
      return Response.json({ error: "Please add a bit more detail (at least 10 characters)." }, { status: 400 });
    }
    if (trimmed.length > 3000) {
      return Response.json({ error: "That's quite long — please keep it under 3000 characters." }, { status: 400 });
    }

    const admin = supabaseAdmin();
    let userId = null;
    let finalEmail = (email || "").trim();

    // Optional auth: if signed in, attach the account and use its email as
    // a fallback — but this route must also work for someone who is locked
    // out and can't sign in at all, so auth is never required here.
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token) {
      const { data } = await admin.auth.getUser(token);
      if (data?.user) {
        userId = data.user.id;
        if (!finalEmail) finalEmail = data.user.email;
      }
    }

    if (!finalEmail) {
      return Response.json({ error: "Please include an email so we can follow up." }, { status: 400 });
    }

    const { error } = await admin.from("support_messages").insert({
      user_id: userId,
      email: finalEmail,
      type: ["bug", "suggestion", "other"].includes(type) ? type : "other",
      message: trimmed,
    });
    if (error) {
      console.error("Support message insert failed:", error);
      return Response.json({ error: "Could not send your message. Try again." }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
