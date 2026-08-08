import { requireUser } from "../../../../lib/supabaseAdmin";

export const maxDuration = 20;

export async function POST(req) {
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
