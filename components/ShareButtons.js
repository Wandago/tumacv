"use client";
import { useState } from "react";

const SITE = "https://tumacv.vercel.app";
const DEFAULT_TEXT = "I'm using TumaCV to tailor my CV for every job I apply to — free to try. Check it out:";

export default function ShareButtons({ text = DEFAULT_TEXT, compact = false }) {
  const [copied, setCopied] = useState(false);
  const url = SITE;
  const encoded = encodeURIComponent(`${text} ${url}`);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={`share-row ${compact ? "compact" : ""}`}>
      <a className="share-btn wa" href={`https://wa.me/?text=${encoded}`} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
      <a className="share-btn x" href={`https://twitter.com/intent/tweet?text=${encoded}`} target="_blank" rel="noopener noreferrer">
        X
      </a>
      <a
        className="share-btn li"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener noreferrer"
      >
        LinkedIn
      </a>
      <button className="share-btn copy" onClick={copyLink}>{copied ? "Copied!" : "Copy link"}</button>
    </div>
  );
}
