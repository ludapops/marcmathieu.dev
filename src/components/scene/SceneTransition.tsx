import styles from "./SceneTransition.module.css";

const helperCopy = {
  ag1: "Scroll to roll",
  battlefield: "Scroll to drop",
  beautynexos: "Scroll to finish",
} as const;

export function SceneTransition({
  index,
  label,
  module,
}: {
  index: string;
  label: string;
  module: "ag1" | "battlefield" | "beautynexos";
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
      <div aria-hidden="true">{helperCopy[module]}</div>
    </section>
  );
}
