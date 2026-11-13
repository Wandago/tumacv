// A row of pill-shaped step markers, like a carousel's page dots: done steps
// solid, the current step long and solid, the rest faint. Drawn in
// currentColor, so it takes the text colour of whatever card it sits on.
export default function StepPills({ total, current, label }) {
  const gap = 6;
  const short = 18;
  const long = 34;
  const h = 8;
  let x = 0;
  const pills = Array.from({ length: total }, (_, i) => {
    const w = i === current ? long : short;
    const pill = (
      <rect key={i} x={x} y={0} width={w} height={h} rx={h / 2} fill="currentColor" opacity={i === current ? 1 : i < current ? 0.55 : 0.22} />
    );
    x += w + gap;
    return pill;
  });
  return (
    <svg
      width={x - gap}
      height={h}
      viewBox={`0 0 ${x - gap} ${h}`}
      role="img"
      aria-label={label || `Step ${current + 1} of ${total}`}
      focusable="false"
    >
      {pills}
    </svg>
  );
}
