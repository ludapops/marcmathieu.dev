type ArrowDirection = "up-right" | "up-left" | "down";

const rotation: Record<ArrowDirection, number> = {
  "up-right": 0,
  "up-left": -90,
  down: 135,
};

export function ArrowIcon({
  direction = "up-right",
  className,
}: {
  direction?: ArrowDirection;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={
        direction === "up-right"
          ? undefined
          : { transform: `rotate(${rotation[direction]}deg)` }
      }
    >
      <path
        d="M3.5 12.5 12.5 3.5M5 3.5h7.5V11"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
