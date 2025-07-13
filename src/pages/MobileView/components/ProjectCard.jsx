// src/pages/MobileView/components/ProjectCard.jsx
import React, { useState } from 'react';
import './ProjectCard.css';
import ProjectDetail from '../modals/ProjectDetail';

export default function ProjectCard({ projects }) {
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [cardOpen, setCardOpen] = useState(false);

  const toggleCardOpen = () => setCardOpen(prev => !prev);

  const toggleProjectAccordion = (id) => {
    setExpandedCardId(prev => (prev === id ? null : id));
  };

  const openDetail = (e, project) => {
    e.stopPropagation();
    setSelectedProject(project);
  };
  const closeDetail = () => setSelectedProject(null);

  return (
    <>
      <div className={`project-card-wrapper ${cardOpen ? 'expanded' : ''}`} onClick={toggleCardOpen}>
        <div className="project-card-header">
          <h2>Projects</h2>
          <span className="toggle-icon">{cardOpen ? '▲' : '▼'}</span>
        </div>

        {cardOpen && (
          <div className="project-accordion">
            {projects.map((project) => (
              <div
                className={`accordion-item ${expandedCardId === project._id ? 'open' : ''}`}
                key={project._id}
              >
                <div
                  className="accordion-title"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProjectAccordion(project._id);
                  }}
                >
                  <h3>{project.name}</h3>
                  <span>{expandedCardId === project._id ? '−' : '+'}</span>
                </div>

                {expandedCardId === project._id && (
                  <div className="accordion-content">
                    <p>{project.description}</p>
                    <p><strong>Status:</strong> {project.status || 'In Progress'}</p>
                    <p><strong>Stack:</strong> {project.tech?.join(', ') || '—'}</p>
                    <button className="edit-btn" onClick={(e) => openDetail(e, project)}>Edit / View</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProject && (
        <ProjectDetail project={selectedProject} onClose={closeDetail} />
      )}
    </>
  );
}
