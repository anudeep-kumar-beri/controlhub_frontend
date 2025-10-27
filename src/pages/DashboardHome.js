import React, { useEffect, useState, useRef } from 'react';
import './DashboardHome.css';
import { useNavigate } from 'react-router-dom';
import api from '../api';


function DashboardHome() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);

  const [skillData, setSkillData] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [journal, setJournal] = useState('');
  const [jobs, setJobs] = useState([]);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [projects, setProjects] = useState([]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [skillsRes, jobsRes, bookmarksRes, journalRes, weeklyLogsRes, projectsRes] = await Promise.all([
  api.get('/skills'),
  api.get('/jobs'),
  api.get('/bookmarks'),
  api.get('/journal'),
  api.get('/weeklylogs'),
  api.get('/projects')
]);

setProjects(projectsRes.data);

        setSkillData(skillsRes.data);
        setJobs(jobsRes.data);
        setBookmarks(bookmarksRes.data);
        setJournal(journalRes.data?.text || '');
        setWeeklyLogs(weeklyLogsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };
    fetchData();
  }, []);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext('2d');
    let width = wrapper.offsetWidth;
    let height = wrapper.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    const spacing = 80;
    const points = [];

    const regeneratePoints = () => {
      points.length = 0;
      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          points.push({ x, y, radius: Math.random() * 1.5 + 0.5 });
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (let p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fill();
      }
      requestAnimationFrame(animate);
    };

    regeneratePoints();
    animate();

    const handleResize = () => {
      width = wrapper.offsetWidth;
      height = wrapper.offsetHeight;
      canvas.width = width;
      canvas.height = height;
      regeneratePoints();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="dashboard-container">
      <div id="css-grid-background"></div>

      <div id="geometry-layer">
        <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" /></svg>
        <svg viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" rx="12" /></svg>
        <svg viewBox="0 0 100 100"><polygon points="50,15 90,85 10,85" /></svg>
        <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" /></svg>
        <svg viewBox="0 0 100 100"><rect x="25" y="25" width="50" height="50" rx="8" /></svg>
        <svg viewBox="0 0 100 100"><polygon points="10,10 90,10 50,90" /></svg>
        <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" /></svg>
        <svg viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70" rx="10" /></svg>
        <svg viewBox="0 0 100 100"><polygon points="50,5 95,50 50,95 5,50" /></svg>
        <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="20" /></svg>
        <svg viewBox="0 0 100 100"><rect x="30" y="30" width="40" height="40" rx="6" /></svg>
        <svg viewBox="0 0 100 100"><polygon points="30,20 70,20 90,80 10,80" /></svg>
        <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="25" /></svg>
        <svg viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" rx="14" /></svg>
        <svg viewBox="0 0 100 100"><polygon points="50,0 100,100 0,100" /></svg>
      </div>

      <div className="title-bar">
        <h1 className="dashboard-title">ControlHub</h1>
      </div>

      <div className="tiles-grid-wrapper" ref={wrapperRef}>
        <canvas id="grid-canvas" ref={canvasRef}></canvas>
        <div className="tiles-grid">

          <div className="card fade-in" onClick={() => navigate('/skill-tracker')}>
            <h2>Skill Tracker</h2>
            <div className="skill-preview">
              {skillData.map((skill, idx) => (
                <div className="skill-bar" key={idx}>
                  <span>{skill.name}</span>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${skill.progress}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

<div className="card wide-card fade-in" onClick={() => navigate('/projects')}>
  <h2>Projects</h2>
  {projects.length === 0 ? (
    <p>No projects</p>
  ) : (
    projects.slice(0, 2).map((proj) => (
      <p key={proj._id}>• {proj.name}</p>
    ))
  )}
  <p><em>Tap to view dashboard →</em></p>
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

          <div className="card fade-in" onClick={() => navigate('/flow-workspace')}>
  <h3>Flow Workspace</h3>
  <p>Visualize and manage project hierarchies with node-based flow.</p>
</div>

          <div className="card wide-card fade-in" onClick={() => navigate('/finance')}>
            <h2>FinanceFlow</h2>
            <ul>
              <li>Master Plus/Minus Sheet</li>
              <li>Investments, Income, Expenses, Loans</li>
              <li>Export to XLSX/PDF</li>
            </ul>
            <p><em>Tap to open Finance dashboard →</em></p>
          </div>


        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
