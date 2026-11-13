import { Card } from "@astryxdesign/core/Card";

// A Kijani Pop colour tile: a Card in one of the brand tones. The theme
// (theme/tumacv.ts) makes each tone a solid block and re-points everything
// inside it — text, icons, fields, primary buttons — so it reads on that
// colour. Tones, loud to quiet:
//   kijani · forest · ink           (white content)
//   lime · sunshine · coral         (ink content)
//   mint · cream · sand · peach     (soft, ink content)
const TONE_VARIANT = {
  kijani: "green",
  forest: "purple",
  ink: "gray",
  lime: "cyan",
  sunshine: "yellow",
  coral: "red",
  mint: "teal",
  cream: "pink",
  sand: "blue",
  peach: "orange",
};

export const TONES = Object.keys(TONE_VARIANT);

export default function Tile({ tone = "mint", interactive = false, className, ...props }) {
  const cls = [interactive && "tile-lift", className].filter(Boolean).join(" ") || undefined;
  return <Card variant={TONE_VARIANT[tone] || "teal"} className={cls} {...props} />;
}
