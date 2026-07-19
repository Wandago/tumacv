export const maxDuration = 20;

export async function POST(req) {
  try {
    const { url } = await req.json();
    let target;
    try {
      target = new URL(url);
      if (!/^https?:$/.test(target.protocol)) throw new Error();
    } catch {
      return Response.json({ error: "That doesn't look like a valid link." }, { status: 400 });
    }

    const res = await fetch(target.toString(), {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return Response.json(
        { error: `That site refused the request (${res.status}). Copy and paste the job description instead.` },
        { status: 422 }
      );
    }

    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&#\d+;|&[a-z]+;/gi, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n\s*/g, "\n\n")
      .trim();

    if (text.length < 200) {
      return Response.json(
        { error: "Couldn't read enough text from that page (it may need login, like LinkedIn). Paste the description instead." },
        { status: 422 }
      );
    }

    return Response.json({ text: text.slice(0, 14000) });
  } catch {
    return Response.json(
      { error: "Couldn't reach that page. Copy and paste the job description instead." },
      { status: 422 }
    );
  }
}
