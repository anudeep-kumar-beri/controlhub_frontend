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
  const [isLoading, setIsLoading] = useState(true);

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
        console.error('❌ Failed to load data:', err);
        alert('Backend not responding. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (skills.length || logs.length || projects.length || bookmarks.length) {
      console.log("✅ MobileView fetched data:", { skills, logs, projects, bookmarks });
    }
  }, [skills, logs, projects, bookmarks]);

  if (isLoading) return <div className="mobile-container">Loading...</div>;

  return (
    <div className="mobile-container">
      <header className="mobile-header">ControlHub</header>

      <section className="grid-section">
        {/* ✅ Always render SkillCard — handle empty state inside */}
        <SkillCard skills={skills} />

        {/* 🧱 Projects accordion catalog */}
        <ProjectCard projects={projects} />

        {/* 🔗 Bookmark list with favicon + edit modal */}
        <BookmarkCard bookmarks={bookmarks} />

        {/* 🪵 Weekly Logs (basic for now) */}
        <div className="log-card-wrapper">
          {logs.length > 0 ? logs.map(log => (
            <div className="glass-card" key={log._id}>
              <h3>{log.week}</h3>
              <p>{log.entry.slice(0, 30)}...</p>
            </div>
          )) : (
            <p>No logs found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
