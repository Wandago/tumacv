import dns from "dns/promises";
import net from "net";

export const maxDuration = 20;

// Blocks SSRF: without this, a user could paste an internal URL (a Vercel
// deployment's own health-check endpoint, a cloud metadata IP, a private
// service on the same network) and have this server fetch it on their
// behalf. We resolve the hostname ourselves and reject anything that lands
// on a private/loopback/link-local address. Redirects are common for real
// job postings (http->https, non-www->www, trailing slashes) so we do
// follow them — but manually, re-validating every hop the same way, since
// a redirect could otherwise point somewhere that only looked safe pre-fetch.
const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal"]);
const MAX_REDIRECTS = 5;

function isBlockedIp(ip) {
  const type = net.isIP(ip);
  if (type === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10) return true; // RFC1918
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local + cloud metadata (169.254.169.254)
    if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
    if (a === 192 && b === 168) return true; // RFC1918
    if (a === 0) return true;
    return false;
  }
  if (type === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true; // loopback
    if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true; // link-local + unique-local
    if (lower.startsWith("::ffff:")) return isBlockedIp(lower.slice(7)); // IPv4-mapped
    return false;
  }
  return true; // couldn't classify it — fail closed
}

async function assertSafeTarget(target) {
  const hostname = target.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) throw new Error("blocked host");
  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) throw new Error("blocked host");
    return;
  }
  const records = await dns.lookup(hostname, { all: true });
  if (records.length === 0) throw new Error("could not resolve host");
  if (records.some((r) => isBlockedIp(r.address))) throw new Error("blocked host");
}

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

    let res;
    let hops = 0;
    for (;;) {
      try {
        await assertSafeTarget(target);
      } catch {
        return Response.json({ error: "That link can't be fetched. Copy and paste the job description instead." }, { status: 400 });
      }

      res = await fetch(target.toString(), {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
          accept: "text/html,application/xhtml+xml",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(12000),
      });

      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        if (++hops > MAX_REDIRECTS) {
          return Response.json(
            { error: "That link redirects too many times — open it in a browser and paste the description instead." },
            { status: 422 }
          );
        }
        let next;
        try {
          next = new URL(res.headers.get("location"), target);
          if (!/^https?:$/.test(next.protocol)) throw new Error();
        } catch {
          return Response.json(
            { error: "That link redirects elsewhere — open it in a browser and paste the description instead." },
            { status: 422 }
          );
        }
        target = next;
        continue;
      }
      break;
    }

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
