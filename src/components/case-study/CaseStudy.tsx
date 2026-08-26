import Image from "next/image";
import type { CSSProperties } from "react";
import type { Project } from "@/content/portfolio";
import { CaseStudyDisclosure } from "./CaseStudyDisclosure";
import { InteractionMap } from "./InteractionMap";
import styles from "./CaseStudy.module.css";

const accents = {
  ag1: { accent: "#b7ef36", paper: "#e8efdf", ink: "#123f39" },
  battlefield: { accent: "#ff5e33", paper: "#191c1d", ink: "#f6eee2" },
  beautynexos: { accent: "#c7a5ff", paper: "#eee8f5", ink: "#251b33" },
} as const;

export function CaseStudy({ project }: { project: Project }) {
  const palette = accents[project.id];
  const coverDimensions =
    project.id === "ag1"
      ? { height: 1263, width: 2240 }
      : { height: 1270, width: 2400 };
  const chapterStyle = {
    "--chapter-accent": palette.accent,
    "--chapter-paper": palette.paper,
    "--chapter-ink": palette.ink,
  } as CSSProperties;

  return (
    <article className={styles.chapter} id={project.id} style={chapterStyle}>
      <header className={styles.header}>
        <div className={styles.chapterMeta}>
          <span>{project.index}</span>
          <span>{project.period}</span>
          <span>{project.role}</span>
        </div>
        <p className={styles.kicker}>{project.kicker}</p>
        <h2 data-motion="heading">{project.shortName}</h2>
        <p className={styles.summary} data-motion="copy">
          {project.summary}
        </p>

        <figure className={styles.coverFigure} data-motion="media">
          <Image
            alt={project.coverImage.alt}
            height={coverDimensions.height}
            sizes="(max-width: 1023px) 100vw, 92vw"
            src={project.coverImage.src}
            width={coverDimensions.width}
          />
          <figcaption>{project.coverImage.caption}</figcaption>
        </figure>

        <dl className={styles.highlights}>
          {project.highlights.map((highlight) => (
            <div key={highlight.label}>
              <dt>{highlight.label}</dt>
              <dd>{highlight.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <CaseStudyDisclosure id={project.id} label={project.shortName}>
        <div className={styles.detailIntro}>
          <p className={styles.label}>Full case study</p>
          <h3>{project.headline}</h3>
        </div>

        <div className={styles.readingZone} data-reading-zone>
          <section>
            <p className={styles.label}>The product problem</p>
            <p className={styles.lead}>{project.problem}</p>
          </section>
          <section>
            <p className={styles.label}>My role</p>
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
          <ol>
            {project.contributions.map((contribution, index) => (
              <li key={contribution}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{contribution}</p>
              </li>
            ))}
          </ol>
        </section>

        {project.evidenceImages?.length ? (
          <section
            className={styles.evidence}
            aria-label={`${project.shortName}: public evidence`}
          >
            <div className={styles.evidenceIntro}>
              <p className={styles.label}>Public evidence</p>
              <h3>The product in public.</h3>
            </div>
            <div className={styles.mediaGrid}>
              {project.evidenceImages.map((image) => (
                <figure key={image.src}>
                  <Image
                    alt={image.alt}
                    height={960}
                    sizes="(max-width: 1023px) 100vw, 80vw"
                    src={image.src}
                    width={1728}
                  />
                  <figcaption>{image.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <footer className={styles.outcome}>
          <div>
            <p className={styles.label}>Outcome</p>
            <p className={styles.outcomeText}>{project.outcome}</p>
          </div>
          <div className={styles.technologyList} aria-label="Technologies used">
            {project.technologies.map((technology) => (
              <span key={technology}>{technology}</span>
            ))}
          </div>
        </footer>
      </CaseStudyDisclosure>

      <nav
        aria-label={`${project.shortName} project links`}
        className={styles.projectLinks}
        data-project-links={project.id}
      >
        <p className={styles.label}>Project links</p>
        <div className={styles.projectLinksList}>
          {project.links.map((link) => (
            <a
              href={link.href}
              key={link.href}
              rel="noreferrer"
              target="_blank"
            >
              <span>{link.label}</span>
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </nav>
    </article>
  );
}
