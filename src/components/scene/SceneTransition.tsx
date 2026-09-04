import styles from "./SceneTransition.module.css";

const helperCopy = {
  ag1: "Scroll to tip",
  battlefield: "Scroll to release",
  beautynexos: "Scroll to transfer",
  finale: "Scroll to celebrate",
} as const;

export function SceneTransition({
  index,
  label,
  module,
}: {
  index: string;
  label: string;
  module: "ag1" | "battlefield" | "beautynexos" | "finale";
}) {
  return (
    <section
      className={styles.transition}
      data-machine-chapter={module}
      aria-label={label}
    >
      <p>
        <span>{index}</span>
        {label}
      </p>
      <div className={styles.helper} aria-hidden="true">
        {helperCopy[module]}
      </div>
      {module === "finale" && (
        <>
          <svg
            className={styles.staticFinale}
            viewBox="0 0 600 300"
            aria-label="An open confetti hopper above a completed machine"
            role="img"
          >
            <path
              d="M100 230V50H500V230M90 240H510M170 50V105H430V50M170 105L230 140M430 105L370 140"
              fill="none"
              stroke="currentColor"
              strokeWidth="7"
            />
            {[140, 180, 220, 260, 300, 340, 380, 420, 460].map((x, i) => (
              <rect
                key={x}
                x={x}
                y={220 + (i % 3) * 5}
                width="12"
                height="5"
                fill="currentColor"
                transform={`rotate(${i * 17} ${x} 225)`}
              />
            ))}
          </svg>
          <div className={styles.finaleControls}>
            <button type="button" data-finale-replay disabled>
              Replay finale
            </button>
            <span data-finale-status role="status">
              Scroll to release the confetti.
            </span>
          </div>
        </>
      )}
    </section>
  );
}
