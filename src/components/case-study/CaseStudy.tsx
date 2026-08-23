import Image from "next/image";
import type { CSSProperties } from "react";
import type { Project } from "@/content/portfolio";
import { InteractionMap } from "./InteractionMap";
import styles from "./CaseStudy.module.css";

const accents = {
  ag1: { accent: "#b7ef36", paper: "#e8efdf", ink: "#123f39" },
  battlefield: { accent: "#ff5e33", paper: "#191c1d", ink: "#f6eee2" },
  beautynexos: { accent: "#c7a5ff", paper: "#eee8f5", ink: "#251b33" },
} as const;

export function CaseStudy({ project }: { project: Project }) {
  const palette = accents[project.id];
  const chapterStyle = {
    "--chapter-accent": palette.accent,
    "--chapter-paper": palette.paper,
    "--chapter-ink": palette.ink,
  } as CSSProperties;

  return (
    <article
      className={styles.chapter}
      data-scene={project.id}
      id={project.id}
      style={chapterStyle}
    >
      <header className={styles.header}>
        <div className={styles.chapterMeta}>
          <span>{project.index}</span>
          <span>{project.period}</span>
          <span>{project.role}</span>
        </div>
        <p className={styles.kicker}>{project.kicker}</p>
        <h2 data-motion-reveal>{project.headline}</h2>
        <p className={styles.summary} data-motion-reveal>
          {project.summary}
        </p>
      </header>

      <div className={styles.readingZone} data-motion-reveal data-reading-zone>
        <section>
          <p className={styles.label}>The product problem</p>
          <p className={styles.lead}>{project.problem}</p>
        </section>
        <section>
          <p className={styles.label}>My boundary</p>
          <p>{project.ownership}</p>
        </section>
      </div>

      <InteractionMap label={project.shortName} steps={project.mapSteps} />

      <section
        className={styles.contributions}
        aria-label={`${project.shortName}: contributions`}
      >
        <p className={styles.label}>Selected contributions</p>
        <h3>What I owned and shipped</h3>
        <ol data-motion-reveal>
          {project.contributions.map((contribution, index) => (
            <li key={contribution}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{contribution}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        className={styles.evidence}
        aria-label={`${project.shortName}: public evidence`}
      >
        <div className={styles.evidenceIntro} data-motion-reveal>
          <p className={styles.label}>Public evidence</p>
          <h3>The shipped product, in public</h3>
        </div>
        <div className={styles.mediaGrid}>
          {project.images.map((image) => (
            <figure key={image.src}>
              <Image
                alt={image.alt}
                data-motion-media
                height={960}
                sizes="(max-width: 800px) 100vw, 80vw"
                src={image.src}
                width={1728}
              />
              <figcaption>{image.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <footer className={styles.outcome} data-motion-reveal>
        <div>
          <p className={styles.label}>Outcome</p>
          <p className={styles.outcomeText}>{project.outcome}</p>
        </div>
        <div className={styles.technologyList} aria-label="Technologies used">
          {project.technologies.map((technology) => (
            <span key={technology}>{technology}</span>
          ))}
        </div>
        <div className={styles.projectLinks}>
          {project.links.map((link) => (
            <a
              href={link.href}
              key={link.href}
              rel="noreferrer"
              target="_blank"
            >
              {link.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </footer>
    </article>
  );
}
