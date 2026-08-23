import styles from "./InteractionMap.module.css";

export function InteractionMap({
  label,
  steps,
}: {
  label: string;
  steps: string[];
}) {
  return (
    <figure className={styles.map} data-motion-reveal>
      <figcaption>{label} · public behavior map</figcaption>
      <ol>
        {steps.map((step, index) => (
          <li key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step}</strong>
          </li>
        ))}
      </ol>
    </figure>
  );
}
