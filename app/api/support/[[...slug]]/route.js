import { requireUser, supabaseAdmin } from "../../../../lib/supabaseAdmin";

export const maxDuration = 20;

// Consolidated under a single optional-catch-all route to stay within
// Vercel's serverless function count — /api/support and /api/support/reply
// are both still live at their original URLs, just dispatched from one
// function based on the path segment.

async function handleNewTicket(req) {
  try {
    const { type, subject, message, email } = await req.json();
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

    // Optional auth: works for a locked-out visitor too, which is exactly
    // when someone most needs to reach support.
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

    const finalType = ["bug", "suggestion", "other"].includes(type) ? type : "other";
    const finalSubject = (subject || "").trim().slice(0, 80) || trimmed.slice(0, 60);

    const { data: ticket, error: ticketErr } = await admin
      .from("support_tickets")
      .insert({ user_id: userId, email: finalEmail, type: finalType, subject: finalSubject })
      .select()
      .single();
    if (ticketErr) {
      console.error("Ticket creation failed:", ticketErr);
      return Response.json({ error: "Could not send your message. Try again." }, { status: 500 });
    }

    const { error: msgErr } = await admin
      .from("support_ticket_messages")
      .insert({ ticket_id: ticket.id, sender: "user", message: trimmed });
    if (msgErr) {
      console.error("First ticket message failed:", msgErr);
      return Response.json({ error: "Could not send your message. Try again." }, { status: 500 });
    }

    return Response.json({ ok: true, ticketId: ticket.id });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}

async function handleReply(req) {
  try {
    const authed = await requireUser(req);
    if (!authed) return Response.json({ error: "Sign in to reply to a ticket." }, { status: 401 });
    const { user, admin } = authed;

    const { ticketId, message } = await req.json();
    const trimmed = (message || "").trim();
    if (trimmed.length < 2) {
      return Response.json({ error: "Write a message first." }, { status: 400 });
    }

    const { data: ticket } = await admin.from("support_tickets").select("id, user_id").eq("id", ticketId).single();
    if (!ticket || ticket.user_id !== user.id) {
      return Response.json({ error: "Ticket not found." }, { status: 404 });
    }

    const { error: msgErr } = await admin
      .from("support_ticket_messages")
      .insert({ ticket_id: ticketId, sender: "user", message: trimmed });
    if (msgErr) return Response.json({ error: "Could not send your reply. Try again." }, { status: 500 });

    // A new message from the user means the conversation is active again,
    // even if it had previously been marked resolved.
    await admin.from("support_tickets").update({ status: "open", updated_at: new Date().toISOString() }).eq("id", ticketId);

    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const { slug } = await params;
  const path = slug?.[0];
  if (!path) return handleNewTicket(req);
  if (path === "reply" && slug.length === 1) return handleReply(req);
  return Response.json({ error: "Not found" }, { status: 404 });
}
