// src/pages/MobileView/modals/ProjectDetail.jsx
import React, { useState } from 'react';
import './ProjectDetail.css';

export default function ProjectDetail({ project, onClose }) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [status, setStatus] = useState(project.status || 'In Progress');
  const [tech, setTech] = useState(project.tech?.join(', ') || '');

  const handleSave = () => {
    console.log('Project Saved:', { name, description, status, tech });
    onClose();
  };

  return (
    <div className="project-detail-modal">
      <button className="close-btn" onClick={onClose}>✕</button>
      <h2>Edit Project</h2>

      <label>Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} />

      <label>Description</label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4" />

      <label>Status</label>
      <input value={status} onChange={(e) => setStatus(e.target.value)} />

      <label>Tech Stack (comma-separated)</label>
      <input value={tech} onChange={(e) => setTech(e.target.value)} />

      <button className="save-btn" onClick={handleSave}>Save Changes</button>
    </div>
  );
}
