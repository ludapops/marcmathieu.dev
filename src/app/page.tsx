import Image from "next/image";
import {
  WorldsInteraction,
  ContactAction,
} from "@/components/worlds/WorldsInteraction";
import { ProjectChapter } from "@/components/worlds/ProjectChapter";
import { projects, career, contactLinks } from "@/content/portfolio";
import { worldPresentation } from "@/content/worlds";
import styles from "@/components/worlds/Worlds.module.css";

export default function PortfolioPage() {
  return (
    <WorldsInteraction>
      <a className={styles.skip} href="#main-content">
        Skip to content
      </a>
      <header className={styles.header}>
        <a
          href="#overview"
          aria-label="Marc Mathieu, overview"
          className={styles.wordmark}
        >
          m<span>m</span>
        </a>
        <span className={styles.headerNote}>
          INDEPENDENT MIND. SHARED AMBITION.
        </span>
        <nav aria-label="Main navigation">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="/Marc-Mathieu-Resume.pdf" className={styles.resumeLink}>
            Résumé ↗
          </a>
          <a href="#contact">
            Let’s talk <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        <section
          id="overview"
          className={styles.overview}
          aria-labelledby="identity"
          tabIndex={-1}
        >
          <span id="top" />
          <div className={styles.eyebrow}>
            <span>SENIOR FRONTEND ENGINEER</span>
            <span>
              MIAMI, FL · OPEN TO THE RIGHT TEAM <i aria-hidden="true" />
            </span>
          </div>
          <h1 id="identity" className={styles.identity}>
            Marc Mathieu
          </h1>
          <div className={styles.intro}>
            <p>
              Complex products,
              <br />
              <em>carefully made.</em>
            </p>
            <p>
              Three different projects. The same attention
              <br className={styles.desktopBreak} /> to how things look, feel,
              and work.
            </p>
            <a href="#work" className={styles.scrollHint}>
              EXPLORE THE WORK <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div id="work" className={styles.panels}>
            {projects.map((project) => {
              const art = worldPresentation[project.id];
              const image =
                project.id === "beautynexos"
                  ? {
                      src: "/images/beautynexos/editorial-face-v2.png",
                      alt: "Warm sunlit beauty portrait with soft glass reflections for the BeautyNexos project",
                    }
                  : project.coverImage;
              return (
                <a
                  key={project.id}
                  href={`#${project.id}`}
                  data-world-link={project.id}
                  className={`${styles.panel} ${styles[art.theme]}`}
                >
                  <div className={styles.panelMeta}>
                    <span>
                      {project.index} / {art.category}
                    </span>
                    <span className={styles.roundArrow} aria-hidden="true">
                      ↗
                    </span>
                  </div>
                  <h2>{project.shortName}</h2>
                  <p className={styles.panelDescription}>{art.invitation}</p>
                  <div className={styles.panelMedia}>
                    <Image
                      src={image.src}
                      preload={project.id === "ag1"}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 700px) 94vw, 45vw"
                    />
                  </div>
                  <div className={styles.panelFooter}>
                    <span>
                      {
                        project.highlights.find(
                          (item) => item.label === "Ownership",
                        )?.value
                      }
                    </span>
                    <span>
                      VIEW PROJECT <span aria-hidden="true">↗</span>
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
          <div className={styles.indexCaption}>
            <span>SELECTED WORK / 2020—2026</span>
            <span>
              AG1: August 2026. BeautyNexos: editorial composition. Battlefield:
              EA key art, 2021. Current products may include subsequent changes.
            </span>
          </div>
        </section>
        {projects.map((project) => (
          <ProjectChapter key={project.id} project={project} />
        ))}
        <section
          id="experience"
          className={styles.experience}
          aria-labelledby="experience-title"
          tabIndex={-1}
        >
          <div className={styles.experienceHeading}>
            <p className={styles.kicker}>EXPERIENCE / 2014—2026</p>
            <h2 id="experience-title">
              A decade of
              <br />
              <em>connecting the dots.</em>
            </h2>
            <p>
              Consumer products. Commerce. Creative tools.
              <br />A career spent making complex things usable.
            </p>
          </div>
          <div className={styles.careerList}>
            {career.map((job) => (
              <div key={job.company}>
                <span>{job.period}</span>
                <h3>{job.company}</h3>
                <p className={styles.careerRole}>{job.role}</p>
                <p>{job.summary}</p>
              </div>
            ))}
          </div>
        </section>
        <section
          id="about"
          className={styles.about}
          aria-labelledby="about-title"
          tabIndex={-1}
        >
          <span id="about-marc" />
          <span className={styles.kicker}>A LITTLE ABOUT ME</span>
          <h2 id="about-title">
            Hands on the details.
            <br />
            Eyes on the whole.
          </h2>
          <p>
            I’m Marc, a Miami-based senior frontend engineer with more than a
            decade of experience. I lead frontend work across disciplines while
            staying hands-on in the code, from early product decisions through
            production.
          </p>
          <a href="/Marc-Mathieu-Resume.pdf">
            The longer story — résumé <span aria-hidden="true">↗</span>
          </a>
        </section>
        <section
          data-contact
          id="next"
          className={styles.contact}
          aria-labelledby="contact-title"
          tabIndex={-1}
        >
          <span id="contact" />
          <div className={styles.contactMeta}>
            <span>04 / THE NEXT PROJECT</span>
            <span>YOURS + MINE</span>
          </div>
          <div className={styles.contactArt} aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className={styles.contactContent}>
            <p>GOOD THINGS START WITH A CONVERSATION.</p>
            <h2 id="contact-title">
              What should
              <br />
              we build <em>next?</em>
            </h2>
            <ContactAction />
          </div>
          <footer>
            <span>MIAMI · REMOTE US · MIAMI / NEW YORK HYBRID</span>
            <div>
              {contactLinks
                .filter((link) => link.label !== "Email")
                .map((link) => (
                  <a key={link.label} href={link.href}>
                    {link.label} <span aria-hidden="true">↗</span>
                  </a>
                ))}
            </div>
            <span>© 2026 MARC MATHIEU</span>
          </footer>
        </section>
      </main>
    </WorldsInteraction>
  );
}
