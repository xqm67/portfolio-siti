import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { projects } from "../../projects.js";

function selectProject(index: number) {
  window.dispatchEvent(new CustomEvent("xm-select-project", { detail: index }));
}

export default function ProjectGallery() {
  const reducedMotion = useReducedMotion();
  return <>
    <div className="projects-grid">
      {projects.slice(0, 3).map((project) => (
        <motion.article key={project.id} className="project-card"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <a className="project-image" href={project.url!} target="_blank" rel="noopener" aria-label={"Apri " + project.name}>
            <img src={project.src} alt={project.alt} loading="lazy" width="1000" height="700" />
            <span className="project-image-label">{project.imageLabel}</span>
            <span className="project-image-action" aria-hidden="true">↗</span>
          </a>
          <div className="project-copy">
          <div className="project-meta"><span>0{project.index + 1}</span><span>{project.categoryLabel}</span></div>
          <h3>{project.name}</h3>
          <p>{project.description}</p>
          <div className="project-actions">
            <a href={project.url!} target="_blank" rel="noopener">{project.index === 1 ? "Codice su GitHub" : "Visita il sito"}<span aria-hidden="true">↗</span></a>
            <button onClick={() => selectProject(project.index)}>{project.trailer ? "Trailer nella PSP" : "Nella PSP"} <span aria-hidden="true">＋</span></button>
          </div>
          </div>
        </motion.article>
      ))}
    </div>
    <div className="experiments">
      <div className="experiments-intro"><p className="eyebrow">Altri percorsi</p><h3>Quello che sto esplorando.</h3><p>Automazioni, hardware e prove che continuano anche fuori dai progetti pubblicati.</p></div>
      {projects.slice(3).map(project => <article className="experiment" key={project.id}>
        <span className="eyebrow">{project.categoryLabel}</span><h3>{project.name}</h3><p>{project.description}</p>
        {project.details && <ul className="experience-points">{project.details.map(point => <li key={point}>{point}</li>)}</ul>}
        <button onClick={() => selectProject(project.index)}>Esplora nella PSP ↗</button>
      </article>)}
    </div>
  </>;
}
