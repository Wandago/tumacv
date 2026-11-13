import { Card } from "@astryxdesign/core/Card";

// A Sunset Pop colour tile: a Card in one of the brand tones. The theme
// (theme/tumacv.ts) makes each tone a solid block and re-points everything
// inside it — text, icons, fields, primary buttons — so it reads on that
// colour. Tones, loud to quiet:
//   magenta · plum · ink              (white content)
//   coral · tangerine · sunshine      (ink content)
//   blush · peach · butter · lilac    (soft, ink content)
const TONE_VARIANT = {
  magenta: "pink",
  plum: "purple",
  ink: "gray",
  coral: "red",
  tangerine: "orange",
  sunshine: "yellow",
  blush: "teal",
  peach: "cyan",
  butter: "blue",
  lilac: "green",
};

export const TONES = Object.keys(TONE_VARIANT);

export default function Tile({ tone = "blush", interactive = false, className, ...props }) {
  const cls = [interactive && "tile-lift", className].filter(Boolean).join(" ") || undefined;
  return <Card variant={TONE_VARIANT[tone] || "teal"} className={cls} {...props} />;
}
