"use client";
import { useState } from "react";
import { HStack } from "@astryxdesign/core/Stack";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";

const SITE_URL = "https://tumacv.vercel.app";
const DEFAULT_MESSAGE = "I just tailored my CV to a real job posting in minutes with TumaCV — free to try:";

const open = (href) => window.open(href, "_blank", "noopener,noreferrer");

export default function ShareButtons({ compact, url = SITE_URL, message = DEFAULT_MESSAGE }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(`${message} ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const size = compact ? "sm" : "md";
  return (
    <HStack gap={2} wrap="wrap" justify={compact ? "center" : "start"}>
      <Button size={size} label="WhatsApp" onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`)} />
      <Button
        size={size}
        label="X"
        onClick={() => open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`)}
      />
      <Button
        size={size}
        label="LinkedIn"
        onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`)}
      />
      <Button
        size={size}
        variant="ghost"
        label={copied ? "Copied!" : "Copy link"}
        icon={<Icon icon={copied ? "check" : "copy"} />}
        onClick={copyLink}
      />
    </HStack>
  );
}
