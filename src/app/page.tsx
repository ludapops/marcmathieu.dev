import { CaseStudy } from "@/components/case-study/CaseStudy";
import { ProjectIndex } from "@/components/project-index/ProjectIndex";
import { SceneTransition } from "@/components/scene/SceneTransition";
import { career, contactLinks, projects } from "@/content/portfolio";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main id="main-content" tabIndex={-1}>
      <section className={styles.hero} aria-labelledby="hero-title" id="top">
        <div className={styles.heroMeta} data-motion="hero">
          <p>Miami · New York · Remote</p>
          <p>Available for senior frontend roles</p>
        </div>

        <div className={styles.heroCopy} data-motion="hero">
          <p className={styles.eyebrow}>
            Marc Mathieu · Senior Frontend Engineer
          </p>
          <h1 id="hero-title">
            Complex products,
            <span>carefully made.</span>
          </h1>
          <p className={styles.intro}>
            I lead frontend work from early product decisions through
            production, shaping both the experience and the system behind it.
          </p>
          <div className={styles.heroActions}>
            <a href="#work">View selected work</a>
            <a href="mailto:avianmathieu@gmail.com">Email Marc</a>
          </div>
        </div>
      </section>

      <section className={styles.work} id="work" aria-labelledby="work-title">
        <header className={styles.sectionHeader} data-motion="heading">
          <p>Selected work · 01 / 03</p>
          <h2 id="work-title">Selected frontend work.</h2>
          <p className={styles.sectionIntro}>
            Three case studies about the product decisions and frontend delivery
            behind AG1, Battlefield 2042, and BeautyNexos.
          </p>
        </header>
        <ProjectIndex projects={projects} />
      </section>

      {projects.map((project) => (
        <div className={styles.projectSequence} key={project.id}>
          <SceneTransition
            index={project.index}
            label={project.shortName}
            module={project.id}
          />
          <CaseStudy project={project} />
        </div>
      ))}

      <section
        className={styles.experience}
        id="experience"
        aria-labelledby="experience-title"
      >
        <header className={styles.sectionHeader} data-motion="heading">
          <p>Experience · 2014 / 2026</p>
          <h2 id="experience-title">
            Twelve years building frontend products.
          </h2>
        </header>
        <div className={styles.timeline} data-motion="rows">
          {career.map((item) => (
            <article key={`${item.company}-${item.period}`}>
              <p className={styles.timelinePeriod}>{item.period}</p>
              <div>
                <h3>{item.role}</h3>
                <p className={styles.company}>{item.company}</p>
              </div>
              <p className={styles.timelineSummary}>{item.summary}</p>
              <ul>
                {item.technologies.map((technology) => (
                  <li key={technology}>{technology}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section
        className={styles.about}
        id="about"
        aria-labelledby="about-title"
      >
        <p className={styles.eyebrow}>About Marc</p>
        <h2 id="about-title" data-motion="heading">
          Good frontend work should make sense to the people using it and the
          people maintaining it.
        </h2>
        <div className={styles.aboutCopy} data-motion="copy">
          <p>
            I&apos;m a Miami-based senior frontend engineer with more than a
            decade of experience building consumer and enterprise products. I
            lead frontend work across disciplines while staying hands-on in the
            code.
          </p>
          <p>
            In practice, that means getting the behavior right for users and
            leaving the frontend clear enough for the next engineer to change.
            I&apos;m especially interested in how AI is changing both the way we
            build software and the interfaces we build around it.
          </p>
        </div>
      </section>

      <section
        className={styles.contact}
        id="contact"
        aria-labelledby="contact-title"
      >
        <p className={styles.eyebrow}>Open to senior frontend roles</p>
        <h2 id="contact-title" data-motion="heading">
          Let&apos;s talk about what you&apos;re building.
        </h2>
        <a className={styles.email} href="mailto:avianmathieu@gmail.com">
          avianmathieu@gmail.com
        </a>
        <div className={styles.contactLinks} data-motion="rows">
          {contactLinks.map((link) => (
            <a
              href={link.href}
              key={link.href}
              rel={link.href.startsWith("http") ? "noreferrer" : undefined}
              target={
                link.href.startsWith("http") || link.href.endsWith(".pdf")
                  ? "_blank"
                  : undefined
              }
            >
              {link.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
        <footer>
          <p>Miami-based · Remote US · Miami or New York hybrid</p>
          <p>© 2026 Marc Mathieu</p>
        </footer>
      </section>
    </main>
  );
}
