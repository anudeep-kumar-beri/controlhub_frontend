
// src/pages/MobileView/MobileView.js
import React, { useEffect, useState } from 'react';
import './MobileView.css';
import { fetchSkills, fetchLogs, fetchProjects, fetchBookmarks } from '../../api';

export default function MobileView() {
  const [skills, setSkills] = useState([]);
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    fetchSkills().then(setSkills);
    fetchLogs().then(setLogs);
    fetchProjects().then(setProjects);
    fetchBookmarks().then(setBookmarks);
  }, []);

  return (
    <div className="mobile-container">
      <header className="mobile-header">ControlHub</header>

      <section className="mobile-section">
        <h2>Skills</h2>
        <div className="skills-container">
          {skills.map(skill => (
            <div className="skill-card" key={skill._id}>
              <span>{skill.name}</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${skill.progress}%` }}
                ></div>
              </div>
              <span className="progress-percent">{skill.progress}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mobile-section">
        <h2>Weekly Logs</h2>
        <ul className="log-list">
          {logs.map(log => (
            <li className="log-item" key={log._id}>{log.week}: {log.entry}</li>
          ))}
        </ul>
      </section>

      <section className="mobile-section">
        <h2>Projects</h2>
        {projects.map(project => (
          <details key={project._id} className="project-item">
            <summary>{project.name}</summary>
            <p>{project.description}</p>
          </details>
        ))}
      </section>

      <section className="mobile-section">
        <h2>Bookmarks</h2>
        <div className="bookmark-list">
          {bookmarks.map(link => (
            <a key={link._id} href={link.url} target="_blank" rel="noreferrer">
              {link.title || link.url}
            </a>
          ))}
        </div>
      </section>

      <nav className="mobile-nav">
        <button>Skills</button>
        <button>Logs</button>
        <button>Projects</button>
        <button>Links</button>
      </nav>
    </div>
  );
}
