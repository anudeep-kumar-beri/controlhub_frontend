// src/pages/MobileView/components/ProjectCard.jsx
import React, { useState } from 'react';
import './ProjectCard.css';
import ProjectDetail from '../modals/ProjectDetail';

export default function ProjectCard({ project }) {
  const [expanded, setExpanded] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const toggleExpand = () => setExpanded(!expanded);
  const openDetail = (e) => {
    e.stopPropagation();
    setShowDetail(true);
  };

  const closeDetail = () => setShowDetail(false);

  return (
    <>
      <div className={`project-card ${expanded ? 'expanded' : ''}`} onClick={toggleExpand}>
        <div className="project-header">
          <h3>{project.name}</h3>
          <span>{expanded ? '▲' : '▼'}</span>
        </div>
        <p className="short-desc">{project.description.slice(0, 50)}...</p>

        {expanded && (
          <div className="project-body">
            <p><strong>Type:</strong> {project.type || 'N/A'}</p>
            <p><strong>Status:</strong> {project.status || 'In Progress'}</p>
            <p><strong>Stack:</strong> {project.tech?.join(', ') || '—'}</p>
            <button className="detail-btn" onClick={openDetail}>Edit / View</button>
          </div>
        )}
      </div>

      {showDetail && (
        <ProjectDetail project={project} onClose={closeDetail} />
      )}
    </>
  );
}
