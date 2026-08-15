"use client";
import { useState } from "react";

const SITE_URL = "https://tumacv.vercel.app";
const DEFAULT_MESSAGE = "I just tailored my CV to a real job posting in minutes with TumaCV — free to try:";

export default function ShareButtons({ compact, url = SITE_URL, message = DEFAULT_MESSAGE }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(`${message} ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`;
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className={`share-row ${compact ? "compact" : ""}`}>
      <a className="share-btn wa" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <a className="share-btn x" href={x} target="_blank" rel="noopener noreferrer">X</a>
      <a className="share-btn li" href={li} target="_blank" rel="noopener noreferrer">LinkedIn</a>
      <button className="share-btn copy" onClick={copyLink}>{copied ? "Copied!" : "Copy link"}</button>
    </div>
  );
}
