// src/pages/MobileView/MobileView.js
import React, { useState, useEffect } from 'react';
import './MobileView.css';
import api from '../../api';

import SkillCard from './components/SkillCard';      // ✅ Unified flip card
import ProjectCard from './components/ProjectCard';  // ✅ Accordion-style project module

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

        {/* ✅ One flip card: skills overview and editor */}
        {skills.length > 0 && <SkillCard skills={skills} />}

        {/* 🧱 Projects: now upgraded to interactive accordion */}
        {projects.map(project => (
          <ProjectCard key={project._id} project={project} />
        ))}

        {/* 🔁 Logs (will be upgraded to swipeable cards later) */}
        {logs.map(log => (
          <div className="glass-card" key={log._id}>
            <h3>{log.week}</h3>
            <p>{log.entry.slice(0, 30)}...</p>
          </div>
        ))}

        {/* 🔗 Bookmarks (basic for now, upgrade soon) */}
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
