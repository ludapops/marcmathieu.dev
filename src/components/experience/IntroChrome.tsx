import styles from "./SplashGate.module.css";

export function IntroChrome() {
  return (
    <div className={styles.chrome} data-intro-chrome aria-hidden="true">
      <div className={styles.meta} data-machine-copy>
        <span>Portfolio / 2026</span>
        <span>Senior frontend engineer</span>
      </div>

      <div className={styles.identity} data-intro-identity data-machine-copy>
        <p>Marc Mathieu</p>
        <span>Product decisions to production code</span>
      </div>

      <div className={styles.machineLabel} data-machine-copy aria-hidden="true">
        <span>Wind</span>
        <i />
        <span>Cascade</span>
        <i />
        <span>Enter</span>
      </div>
    </div>
  );
}
