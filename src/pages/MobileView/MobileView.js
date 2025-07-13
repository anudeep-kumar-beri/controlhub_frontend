// src/pages/MobileView/MobileView.js
import React, { useState, useEffect } from 'react';
import './MobileView.css';
import api from '../../api';

import SkillCard from './components/SkillCard';       // ✅ Flip card for skills
import ProjectCard from './components/ProjectCard';   // ✅ Accordion-style projects
import BookmarkCard from './components/BookmarkCard'; // ✅ Vision-style bookmarks

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
        {/* ✅ Flip card: Skill overview + back-edit */}
        {skills.length > 0 && <SkillCard skills={skills} />}

        {/* 🧱 Accordion Project catalog */}
        {projects.length > 0 && <ProjectCard projects={projects} />}

        {/* 🔗 Bookmark list with favicon and edit */}
        {bookmarks.length > 0 && <BookmarkCard bookmarks={bookmarks} />}

        {/* 🔁 Logs (pending upgrade to swipe + modal) */}
        {logs.map(log => (
          <div className="glass-card" key={log._id}>
            <h3>{log.week}</h3>
            <p>{log.entry.slice(0, 30)}...</p>
          </div>
        ))}
      </section>
    </div>
  );
}
