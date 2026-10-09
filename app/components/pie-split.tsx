const COLORS = ["#101010", "#4d4d4d", "#777777", "#a7a7a7", "#cecece"];

type PieSplitProps = {
  bps: readonly number[];
  labels?: readonly string[];
  className?: string;
};

export function PieSplit({ bps, labels, className = "h-44 w-44" }: PieSplitProps) {
  const percentages = bps.map((share) => Math.min(100, Math.max(0, share / 100)));
  const offsets = percentages.map((_, index) =>
    percentages.slice(0, index).reduce((sum, share) => sum + share, 0),
  );
  const description = bps
    .map((share, index) => `${labels?.[index] || `Person ${index + 1}`}: ${(share / 100).toFixed(2)}%`)
    .join(", ");

  return (
    <svg
      viewBox="0 0 42 42"
      role="img"
      aria-label={`Payment split. ${description}`}
      className={className}
    >
      <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="#ffffff" strokeWidth="8" />
      {percentages.map((percentage, index) => {
        const dashOffset = -offsets[index];
        return (
          <circle
            key={index}
            cx="21"
            cy="21"
            r="15.9155"
            fill="transparent"
            stroke={COLORS[index % COLORS.length]}
            strokeWidth="8"
            strokeDasharray={`${percentage} ${100 - percentage}`}
            strokeDashoffset={dashOffset}
            pathLength="100"
            transform="rotate(-90 21 21)"
          />
        );
      })}
    </svg>
  );
}

export const PIE_COLORS = COLORS;
