// src/pages/MobileView/components/ProjectCard.jsx
import React, { useState } from 'react';
import './ProjectCard.css';
import ProjectDetail from '../modals/ProjectDetail';

export default function ProjectCard({ projects }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const toggleExpand = () => setExpanded(prev => !prev);
  const openDetail = (e, project) => {
    e.stopPropagation();
    setSelectedProject(project);
  };
  const closeDetail = () => setSelectedProject(null);

  return (
    <>
      <div className={`project-card-wrapper ${expanded ? 'expanded' : ''}`} onClick={toggleExpand}>
        <div className="project-card-header">
          <h2>Projects</h2>
          <span className="toggle-icon">{expanded ? '▲' : '▼'}</span>
        </div>

        {expanded && (
          <div className="project-list">
            {projects.map((project) => (
              <div className="project-item" key={project._id}>
                <div>
                  <h3>{project.name}</h3>
                  <p>{project.description?.slice(0, 50)}...</p>
                  <p><strong>Status:</strong> {project.status || 'In Progress'}</p>
                  <p><strong>Stack:</strong> {project.tech?.join(', ') || '—'}</p>
                </div>
                <button className="edit-btn" onClick={(e) => openDetail(e, project)}>Edit / View</button>
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
