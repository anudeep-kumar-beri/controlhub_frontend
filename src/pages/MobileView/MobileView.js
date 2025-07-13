// src/pages/MobileView/MobileView.js
import React, { useState, useEffect } from 'react';
import './MobileView.css';
import api from '../../api';

export default function MobileView() {
  const [skills, setSkills] = useState([]);
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [activeType, setActiveType] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [skillsRes, logsRes, projectsRes, bookmarksRes] = await Promise.all([
          api.get('/skills'),
          api.get('/weeklylogs'),
          api.get('/projects'),
          api.get('/bookmarks'),
        ]);

        setSkills(skillsRes.data);
        setLogs(logsRes.data);
        setProjects(projectsRes.data);
        setBookmarks(bookmarksRes.data);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    }
    loadData();
  }, []);

  const closeCard = () => {
    setActiveCard(null);
    setActiveType(null);
  };

  const renderDetailView = () => {
    if (!activeCard) return null;
    return (
      <div className="fullscreen-card">
        <button className="close-btn" onClick={closeCard}>✕</button>
        <h2>{activeCard.name || activeCard.week || activeCard.title}</h2>
        <div className="detail-body">
          {activeType === 'skill' && (
            <>
              <p>Progress: {activeCard.progress}%</p>
              <progress value={activeCard.progress} max="100"></progress>
            </>
          )}
          {activeType === 'log' && <p>{activeCard.entry}</p>}
          {activeType === 'project' && <p>{activeCard.description}</p>}
          {activeType === 'bookmark' && <a href={activeCard.url} target="_blank" rel="noreferrer">Visit</a>}
        </div>
      </div>
    );
  };

  return (
    <div className="mobile-container">
      <header className="mobile-header">ControlHub</header>

      <section className="grid-section">
        {skills.map(skill => (
          <div
            className="glass-card"
            key={skill._id}
            onClick={() => { setActiveCard(skill); setActiveType('skill'); }}>
            <h3>{skill.name}</h3>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${skill.progress}%` }}></div>
            </div>
            <p>{skill.progress}%</p>
          </div>
        ))}

        {logs.map(log => (
          <div
            className="glass-card"
            key={log._id}
            onClick={() => { setActiveCard(log); setActiveType('log'); }}>
            <h3>{log.week}</h3>
            <p>{log.entry.slice(0, 30)}...</p>
          </div>
        ))}

        {projects.map(project => (
          <div
            className="glass-card"
            key={project._id}
            onClick={() => { setActiveCard(project); setActiveType('project'); }}>
            <h3>{project.name}</h3>
            <p>{project.description.slice(0, 30)}...</p>
          </div>
        ))}

        {bookmarks.map(link => (
          <div
            className="glass-card"
            key={link._id}
            onClick={() => { setActiveCard(link); setActiveType('bookmark'); }}>
            <h3>{link.title || link.url}</h3>
            <p>Tap to open</p>
          </div>
        ))}
      </section>

      {renderDetailView()}
    </div>
  );
}
