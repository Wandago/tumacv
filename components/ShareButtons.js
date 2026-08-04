"use client";
import { useState } from "react";

const SITE_URL = "https://tumacv.vercel.app";
const MESSAGE = "I just tailored my CV to a real job posting in minutes with TumaCV — free to try:";

export default function ShareButtons({ compact }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(`${MESSAGE} ${SITE_URL}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(`${MESSAGE} ${SITE_URL}`)}`;
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(MESSAGE)}&url=${encodeURIComponent(SITE_URL)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE_URL)}`;

  return (
    <div className={`share-row ${compact ? "compact" : ""}`}>
      <a className="share-btn wa" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a>
      <a className="share-btn x" href={x} target="_blank" rel="noopener noreferrer">X</a>
      <a className="share-btn li" href={li} target="_blank" rel="noopener noreferrer">LinkedIn</a>
      <button className="share-btn copy" onClick={copyLink}>{copied ? "Copied!" : "Copy link"}</button>
    </div>
  );
}
