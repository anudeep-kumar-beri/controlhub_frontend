// src/pages/DashboardHome.jsx
import React, { useEffect, useState } from 'react';
import './DashboardHome.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'https://controlhub-backend.onrender.com/api';

function DashboardHome() {
  const navigate = useNavigate();

  const [skillData, setSkillData] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [journal, setJournal] = useState('');
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [skillsRes, jobsRes, bookmarksRes, journalRes] = await Promise.all([
          axios.get(`${API_BASE}/skills`),
          axios.get(`${API_BASE}/jobs`),
          axios.get(`${API_BASE}/bookmarks`),
          axios.get(`${API_BASE}/journal`)
        ]);

        setSkillData(skillsRes.data);
        setJobs(jobsRes.data);
        setBookmarks(bookmarksRes.data);
        setJournal(journalRes.data?.text || '');

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="title-bar">
        <h1 className="dashboard-title">ControlHub</h1>
      </div>

      <div className="tiles-grid">
        <div className="card fade-in" onClick={() => navigate('/skill-tracker')}>
          <h2>Skill Tracker</h2>
          <div className="skill-preview">
            {skillData.map((skill, idx) => (
              <div className="skill-bar" key={idx}>
                <span>{skill.name}</span>
                <div className="bar-bg">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${skill.progress || 0}%`,
                      backgroundColor: '#ffffff'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card wide-card fade-in" onClick={() => navigate('/file-share-board')}>
          <h2>FileShare Board</h2>
          <p>Version: <strong>v1.0.0</strong></p>
          <p>Features: Upload, JWT Auth</p>
        </div>

        <div className="card fade-in" onClick={() => navigate('/weekly-logs')}>
          <h2>Weekly Logs</h2>
          <ul>
            <li>Week 1: Setup FileShare</li>
            <li>Week 2: UI completed</li>
          </ul>
        </div>

        <div className="card tall-card fade-in" onClick={() => navigate('/job-tracker')}>
          <h2>Job Tracker</h2>
          <ul>
            {jobs.length === 0 ? (
              <li>No jobs added</li>
            ) : (
              jobs.slice(0, 2).map((job, idx) => (
                <li key={idx}>{job.role} – {job.status}</li>
              ))
            )}
          </ul>
        </div>

        <div className="card fade-in" onClick={() => navigate('/bookmarks')}>
          <h2>Bookmarks</h2>
          <ul>
            {bookmarks.length === 0 ? (
              <li>No bookmarks</li>
            ) : (
              bookmarks.slice(0, 3).map((bm, idx) => (
                <li key={idx}>{bm.title}</li>
              ))
            )}
          </ul>
        </div>

        <div className="card wide-card fade-in" onClick={() => navigate('/quick-journal')}>
          <h2>Quick Journal</h2>
          <p>{journal || 'No journal entry yet.'}</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
