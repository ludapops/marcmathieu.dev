import { CaseStudy } from "@/components/case-study/CaseStudy";
import { ProjectIndex } from "@/components/project-index/ProjectIndex";
import { SceneTransition } from "@/components/scene/SceneTransition";
import { career, contactLinks, projects } from "@/content/portfolio";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main id="main-content">
      <section className={styles.hero} aria-labelledby="hero-title" id="top">
        <div className={styles.heroMeta} data-motion-hero>
          <p>Miami · New York · Remote</p>
          <p>Available for senior frontend roles</p>
        </div>

        <div className={styles.heroCopy} data-motion-hero>
          <p className={styles.eyebrow}>
            Marc Mathieu · Senior Frontend Engineer
          </p>
          <h1 id="hero-title">
            Complex products,
            <span>carefully made.</span>
          </h1>
          <p className={styles.intro}>
            I build product interfaces where design judgment and production
            engineering have to agree.
          </p>
          <div className={styles.heroActions}>
            <a href="#work">View selected work</a>
            <a href="mailto:avianmathieu@gmail.com">Email Marc</a>
          </div>
        </div>

        <div className={styles.heroObject} data-motion-hero aria-hidden="true">
          <span className={styles.orbit} />
          <span className={styles.node} />
          <span className={styles.axis} />
        </div>
      </section>

      <section className={styles.work} id="work" aria-labelledby="work-title">
        <header className={styles.sectionHeader} data-motion-reveal>
          <p>Selected work · 01 / 03</p>
          <h2 id="work-title">Selected systems, built in the details.</h2>
          <p className={styles.sectionIntro}>
            I worked on subscription commerce, a game-creation interface, and a
            cross-platform member product. Each one made complexity visible in a
            different way.
          </p>
        </header>
        <ProjectIndex projects={projects} />
      </section>

      {projects.map((project) => (
        <div className={styles.projectSequence} key={project.id}>
          <SceneTransition
            index={project.index}
            label={project.shortName}
            scene={project.id}
          />
          <CaseStudy project={project} />
        </div>
      ))}

      <section
        className={styles.experience}
        id="experience"
        aria-labelledby="experience-title"
      >
        <header className={styles.sectionHeader} data-motion-reveal>
          <p>Experience · 2014 / 2026</p>
          <h2 id="experience-title">Twelve years in the interface layer.</h2>
        </header>
        <div className={styles.timeline} data-motion-stagger>
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
        <h2 id="about-title" data-motion-reveal>
          I like the point where a complicated system becomes a clear interface.
        </h2>
        <div className={styles.aboutCopy} data-motion-reveal>
          <p>
            I am a Miami-based senior frontend engineer with more than a decade
            of experience building consumer and enterprise products. I have led
            frontend delivery across product, design, QA, backend, and client
            teams without giving up the hands-on work.
          </p>
          <p>
            My strongest work connects architecture to what someone can actually
            see and use: a subscription choice that behaves correctly, a creator
            tool that makes a dense model understandable, or a feature that
            gives web and mobile users the same answer.
          </p>
        </div>
      </section>

      <section
        className={styles.contact}
        id="contact"
        aria-labelledby="contact-title"
      >
        <p className={styles.eyebrow}>Open to senior frontend roles</p>
        <h2 id="contact-title" data-motion-reveal>
          Building something complicated?
        </h2>
        <a className={styles.email} href="mailto:avianmathieu@gmail.com">
          avianmathieu@gmail.com
        </a>
        <div className={styles.contactLinks} data-motion-stagger>
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
