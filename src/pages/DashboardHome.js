import React, { useEffect, useState } from 'react';
import './DashboardHome.css';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function DashboardHome() {
  const navigate = useNavigate();

  const [skillData, setSkillData] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [journal, setJournal] = useState('');
  const [jobs, setJobs] = useState([]);
  const [weeklyLogs, setWeeklyLogs] = useState([]); // ✅ NEW

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [skillsRes, jobsRes, bookmarksRes, journalRes, weeklyLogsRes] = await Promise.all([
          api.get('/skills'),
          api.get('/jobs'),
          api.get('/bookmarks'),
          api.get('/journal'),
          api.get('/weeklylogs') // ✅ NEW
        ]);

        setSkillData(skillsRes.data);
        setJobs(jobsRes.data);
        setBookmarks(bookmarksRes.data);
        setJournal(journalRes.data?.text || '');
        setWeeklyLogs(weeklyLogsRes.data); // ✅ NEW

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard-container">
    <div id="geometry-layer">
  <svg className="pulse-shape" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="40" />
  </svg>
  <svg className="pulse-shape" viewBox="0 0 100 100">
    <rect x="20" y="20" width="60" height="60" rx="12" />
  </svg>
  <svg className="pulse-shape" viewBox="0 0 100 100">
    <polygon points="50,15 90,85 10,85" />
  </svg>
</div>

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
                      width: `${skill.progress}%`,
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
            {weeklyLogs.length === 0 ? (
              <li>No logs yet</li>
            ) : (
              weeklyLogs.slice(0, 2).map((log, idx) => (
                <li key={idx}>{log.weekRange} – {log.objectives.length} tasks</li>
              ))
            )}
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
