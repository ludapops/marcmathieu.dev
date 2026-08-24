import styles from "./SceneTransition.module.css";

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
      <div aria-hidden="true">Scroll to enter</div>
    </section>
  );
}
