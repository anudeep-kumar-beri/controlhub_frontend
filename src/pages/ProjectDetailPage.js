// src/pages/ProjectDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ControlHubBackground from '../components/backgrounds/ControlHubBackground';
import ProjectAnimation from '../components/animations/ProjectAnimation'; // ✅ Corrected
import './ProjectDetailPage.css';

const API_URL = 'https://controlhub-backend.onrender.com/api/projects';

function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/${id}`)
      .then(res => {
        setProject(res.data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <div className="project-detail-page">Loading...</div>;
  if (!project) return <div className="project-detail-page">Project not found</div>;

  return (
    <div className="project-detail-page">
      <ControlHubBackground />
      <ProjectAnimation />
      <main className="project-detail-container glassy">
        <h2>{project.name}</h2>
        <p><strong>Version:</strong> {project.version || 'N/A'}</p>
        <p><strong>Description:</strong> {project.description || 'No description provided.'}</p>

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
                <li key={i}>{bug.text} — <em>{bug.status}</em></li>
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
                  )} — <em>{f.status}</em>
                </li>
              ))
            ) : (
              <li>No features added.</li>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}

export default ProjectDetailPage;
