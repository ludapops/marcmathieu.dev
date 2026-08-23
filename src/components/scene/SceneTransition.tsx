import styles from "./SceneTransition.module.css";

export function SceneTransition({
  index,
  label,
  scene,
}: {
  index: string;
  label: string;
  scene: "ag1" | "battlefield" | "beautynexos";
}) {
  return (
    <section
      className={styles.transition}
      data-scene={scene}
      data-scene-transition
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
