// src/pages/MobileView/MobileView.js
import React, { useState, useEffect } from 'react';
import './MobileView.css';
import api from '../../api';
import SkillCard from './components/SkillCard'; // ✅ import SkillCard

export default function MobileView() {
  const [skills, setSkills] = useState([]);
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

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

  return (
    <div className="mobile-container">
      <header className="mobile-header">ControlHub</header>

      <section className="grid-section">

        {/* ✅ NEW: Vision-style skill cards */}
        {skills.map(skill => (
          <SkillCard key={skill._id} skill={skill} />
        ))}

        {/* 🔁 Logs: keep old structure for now */}
        {logs.map(log => (
          <div
            className="glass-card"
            key={log._id}
            onClick={() => console.log('Tapped log:', log)}
          >
            <h3>{log.week}</h3>
            <p>{log.entry.slice(0, 30)}...</p>
          </div>
        ))}

        {/* 🧱 Projects: temporary static card */}
        {projects.map(project => (
          <div
            className="glass-card"
            key={project._id}
            onClick={() => console.log('Tapped project:', project)}
          >
            <h3>{project.name}</h3>
            <p>{project.description.slice(0, 30)}...</p>
          </div>
        ))}

        {/* 🔗 Bookmarks: temporary static card */}
        {bookmarks.map(link => (
          <div
            className="glass-card"
            key={link._id}
            onClick={() => window.open(link.url, '_blank')}
          >
            <h3>{link.title || link.url}</h3>
            <p>Tap to open</p>
          </div>
        ))}
      </section>
    </div>
  );
}
