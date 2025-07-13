// src/pages/ProjectDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // ⬅️ Add useNavigate
import axios from 'axios';
import ControlHubBackground from '../components/backgrounds/ControlHubBackground';
import ProjectDetailAnimation from '../components/animations/ProjectDetailAnimation';
import './ProjectDetailPage.css';

const API_URL = 'https://controlhub-backend.onrender.com/api/projects';

function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate(); // ⬅️ New
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [editingDesc, setEditingDesc] = useState(false);
  const [editingVersion, setEditingVersion] = useState(false);
  const [descInput, setDescInput] = useState('');
  const [versionInput, setVersionInput] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/${id}`)
      .then(res => {
        setProject(res.data);
        setDescInput(res.data.description || '');
        setVersionInput(res.data.version || '');
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [id]);

  const updateField = async (field, value) => {
    if (!project) return;
    try {
      const updated = { ...project, [field]: value };
      const res = await axios.put(`${API_URL}/${project._id}`, updated);
      setProject(res.data);
      if (field === 'description') setEditingDesc(false);
      if (field === 'version') setEditingVersion(false);
    } catch (err) {
      console.error('Error updating field:', err);
    }
  };

  const deleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await axios.delete(`${API_URL}/${project._id}`);
      navigate('/projects'); // ⬅️ Redirect after deletion
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project.');
    }
  };

  if (isLoading) return <div className="project-detail-page">Loading...</div>;
  if (!project) return <div className="project-detail-page">Project not found</div>;

  return (
    <div className="project-detail-page">
      <ControlHubBackground />
      <ProjectDetailAnimation />
      <main className="project-detail-container glassy">
        <h2>{project.name}</h2>

        <p>
          <strong>Version:</strong>{' '}
          {editingVersion ? (
            <>
              <input
                value={versionInput}
                onChange={(e) => setVersionInput(e.target.value)}
              />{' '}
              <button onClick={() => updateField('version', versionInput)}>💾</button>
            </>
          ) : (
            <>
              {project.version || 'N/A'}{' '}
              <button onClick={() => setEditingVersion(true)}>✏️</button>
            </>
          )}
        </p>

        <p>
          <strong>Description:</strong>{' '}
          {editingDesc ? (
            <>
              <input
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
              />{' '}
              <button onClick={() => updateField('description', descInput)}>💾</button>
            </>
          ) : (
            <>
              {project.description || 'No description provided.'}{' '}
              <button onClick={() => setEditingDesc(true)}>✏️</button>
            </>
          )}
        </p>

        <section>
          <h3>📜 Changelog</h3>
          <ul>
            {project.changelog?.length ? (
              project.changelog.map((log, i) => (
                <li key={i}>
                  <strong>{log.version}</strong> — {log.summary} <em>({log.date} {log.time})</em>
                </li>
              ))
            ) : (
              <li>No changelog available.</li>
            )}
          </ul>
        </section>

        <section>
          <h3>🐞 Bugs</h3>
          <ul>
            {project.bugs?.length ? (
              project.bugs.map((bug, i) => (
                <li key={i}>
                  {bug.text} — <span className={`status-badge ${bug.status.toLowerCase().replace(/\s+/g, '-')}`}>{bug.status}</span>
                </li>
              ))
            ) : (
              <li>No bugs logged.</li>
            )}
          </ul>
        </section>

        <section>
          <h3>🚀 Features</h3>
          <ul>
            {project.features?.length ? (
              project.features.map((f, i) => (
                <li key={i}>
                  {f.link ? (
                    <a href={f.link} target="_blank" rel="noreferrer">{f.text}</a>
                  ) : (
                    f.text
                  )} — <span className={`status-badge ${f.status.toLowerCase().replace(/\s+/g, '-')}`}>{f.status}</span>
                </li>
              ))
            ) : (
              <li>No features added.</li>
            )}
          </ul>
        </section>

        {/* 🗑️ Delete Project Button */}
        <div style={{ marginTop: '2rem' }}>
          <button
            style={{
              padding: '0.6rem 1.2rem',
              background: '#ff4444',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
            }}
            onClick={deleteProject}
          >
            🗑️ Delete Project
          </button>
        </div>
      </main>
    </div>
  );
}

export default ProjectDetailPage;
