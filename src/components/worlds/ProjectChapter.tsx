import Image from "next/image";
import type { Project } from "@/content/portfolio";
import { worldPresentation } from "@/content/worlds";
import styles from "./Worlds.module.css";

function Evidence({
  image,
  label,
  sizes = "(max-width: 700px) 94vw, 46vw",
}: {
  image: NonNullable<Project["evidenceImages"]>[number];
  label: string;
  sizes?: string;
}) {
  return (
    <figure className={styles.evidence}>
      <div className={styles.evidenceLabel}>{label}</div>
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
      />
      <figcaption>{image.caption}</figcaption>
    </figure>
  );
}

export function ProjectChapter({ project }: { project: Project }) {
  const art = worldPresentation[project.id];
  return (
    <article
      id={project.id}
      className={`${styles.chapter} ${styles[`${art.theme}Chapter`]}`}
      aria-labelledby={`${project.id}-title`}
      tabIndex={-1}
    >
      <div className={styles.chapterTop}>
        <a href="#overview" data-return-world={project.id}>
          ↖ All projects
        </a>
        <span>
          {project.index} / {project.period} / CODE PARTICLE
        </span>
      </div>
      <div className={styles.chapterHeading}>
        <div>
          <p className={styles.kicker}>{art.chapterLabel}</p>
          <h2 id={`${project.id}-title`}>
            {art.heading[0]}
            <br />
            <em>{art.heading[1]}</em>
          </h2>
        </div>
        <p>{project.summary}</p>
      </div>
      <dl className={styles.facts}>
        <div>
          <dt>MY CONTRIBUTION</dt>
          <dd>
            {
              project.highlights.find((item) => item.label === "Ownership")
                ?.value
            }
          </dd>
        </div>
        <div>
          <dt>ENGAGEMENT</dt>
          <dd>
            {project.role}
            <br />
            {project.id === "battlefield"
              ? "Mid-2020 — December 2021"
              : project.period}
          </dd>
        </div>
        <div>
          <dt>BUILT WITH</dt>
          <dd>
            {project.highlights.find((item) => item.label === "Stack")?.value}
          </dd>
        </div>
      </dl>
      {project.id === "ag1" && (
        <div className={styles.commerceSpread}>
          <div className={styles.commerceStory}>
            <p className={styles.kicker}>THE PRODUCT PROBLEM</p>
            <h3>
              A choice on screen.
              <br />A subscription behind it.
            </h3>
            <p>{project.problem}</p>
            <ol className={styles.journey}>
              {project.mapSteps.map((step, index) => (
                <li key={step}>
                  <span>0{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <small>The public purchase journey, simplified.</small>
          </div>
          <div>
            {project.evidenceImages?.map((image) => (
              <Evidence
                key={image.src}
                image={image}
                label="01 / THE PURCHASE EXPERIENCE"
              />
            ))}
          </div>
        </div>
      )}
      {project.id === "battlefield" && (
        <>
          <div id="battlefield-evidence" className={styles.evidencePair}>
            {project.evidenceImages?.map((image, index) => (
              <Evidence
                key={image.src}
                image={image}
                label={
                  index === 0
                    ? "01 / WEAPON SELECTION"
                    : "02 / EQUIPMENT SELECTION"
                }
              />
            ))}
          </div>
          <div className={styles.problemStatement}>
            <p className={styles.kicker}>THE PRODUCT PROBLEM</p>
            <p>{project.problem}</p>
          </div>
        </>
      )}
      {project.id === "beautynexos" && (
        <>
          <div className={styles.beautySpread}>
            <div className={styles.beautyStory}>
              <p className={styles.kicker}>THE PRODUCT PROBLEM</p>
              <h3>
                Many moving parts.
                <br />
                One member experience.
              </h3>
              <p>
                {project.problem} My work connected calendar discovery, content
                tools, and payment flows across Flutter and Strapi.
              </p>
            </div>
            <Evidence
              image={project.coverImage}
              label="01 / THE PUBLIC EXPERIENCE"
            />
          </div>
          <div className={styles.calendarSpread}>
            {project.evidenceImages?.map((image) => (
              <Evidence
                key={image.src}
                image={image}
                label="02 / TRADE CALENDAR"
                sizes="(max-width: 700px) 94vw, 70vw"
              />
            ))}
            <div>
              <p className={styles.kicker}>FIND THE RIGHT MOMENT</p>
              <h3>
                Dates. Places.
                <br />
                Possibilities.
              </h3>
              <p>
                Event browsing and filtering across dates, locations,
                categories, regions, and topics.
              </p>
              <span>PUBLIC PRODUCT VIEW</span>
            </div>
          </div>
        </>
      )}
      <div className={styles.contributionHeader}>
        <p className={styles.kicker}>THE WORK, UP CLOSE</p>
        <span>SELECT A NOTE TO EXPLORE</span>
      </div>
      <div className={styles.annotations}>
        {art.decisions.map((decision, index) => (
          <details key={decision.title}>
            <summary>
              <span>0{index + 1}</span>
              {decision.title}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{decision.detail}</p>
          </details>
        ))}
      </div>
      <div className={styles.outcome}>
        <div>
          <p className={styles.kicker}>WHAT SHIPPED</p>
          <p>{project.outcome}</p>
        </div>
        <div className={styles.projectLinks}>
          {project.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              {link.label} <span aria-hidden="true">↗</span>
              <span className={styles.srOnly}> (opens in a new tab)</span>
            </a>
          ))}
        </div>
      </div>
      <a
        className={styles.chapterExit}
        href="#overview"
        data-return-world={project.id}
      >
        Back to all projects <span aria-hidden="true">↖</span>
      </a>
    </article>
  );
}
