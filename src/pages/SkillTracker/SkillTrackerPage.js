// SkillTrackerPage.js (Redesigned)
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ControlHubBackground from "../components/backgrounds/ControlHubBackground";
import SkillTrackerAnimation from "../components/animations/SkillTrackerAnimation";
import "../components/animations/skillTrackerAnimation.css";
import "./SkillTrackerPage.css";

const API_URL = 'https://controlhub-backend.onrender.com/api/skills';
const CATEGORIES = ['All', 'Frontend', 'Backend', 'Database', 'DevOps', 'Testing', 'General'];

function SkillTrackerPage() {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [newProgress, setNewProgress] = useState(0);
  const [category, setCategory] = useState('General');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => { fetchSkills(); }, []);

  const fetchSkills = async () => {
    try {
      const res = await axios.get(API_URL);
      setSkills(res.data);
    } catch (err) {
      console.error('Failed to load skills', err);
    }
  };

  const addSkill = async () => {
    if (!newSkill.trim()) return;
    try {
      const res = await axios.post(API_URL, { name: newSkill.trim(), progress: newProgress, category });
      setSkills([...skills, res.data]);
      setNewSkill('');
      setNewProgress(0);
    } catch (err) {
      console.error('Error adding skill', err);
    }
  };

  const updateProgress = async (index, value) => {
    const skill = skills[index];
    try {
      await axios.put(`${API_URL}/${skill._id}`, { progress: value });
      const updated = [...skills];
      updated[index].progress = value;
      setSkills(updated);
    } catch (err) {
      console.error('Error updating skill progress', err);
    }
  };

  const removeSkill = async (index) => {
    const skill = skills[index];
    try {
      await axios.delete(`${API_URL}/${skill._id}`);
      setSkills(skills.filter((_, i) => i !== index));
    } catch (err) {
      console.error('Error deleting skill', err);
    }
  };

  const getAlert = (progress) => {
    if (progress < 30) return 'Beginner';
    if (progress < 70) return 'Intermediate';
    if (progress < 100) return 'Advanced';
    return 'Mastered';
  };

  const filteredSkills = skills.filter(skill =>
    (filterCategory === 'All' || skill.category === filterCategory)
  );

  const average =
    skills.length === 0
      ? 0
      : Math.round(skills.reduce((sum, s) => sum + s.progress, 0) / skills.length);

  return (
    <div className="skill-page relative min-h-screen bg-black text-white overflow-hidden">
      <ControlHubBackground />
      <SkillTrackerAnimation />
      <main className="relative z-10 max-w-4xl mx-auto px-4 pb-12">
        <h1 className="page-title">Skill Tracker</h1>

        <section className="glass-section">
          <div className="skill-add-form">
            <input type="text" placeholder="Skill Name" value={newSkill} onChange={e => setNewSkill(e.target.value)} />
            <input type="number" placeholder="%" min="0" max="100" value={newProgress} onChange={e => setNewProgress(Number(e.target.value))} />
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.slice(1).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <button onClick={addSkill}>＋</button>
          </div>
        </section>

        <section className="category-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`tab-btn ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >{cat}</button>
          ))}
        </section>

        <section className="average-banner">
          📈 Average Skill Level: <strong>{average}%</strong>
        </section>

        <section className="skill-list">
          {filteredSkills.length === 0 && <p className="empty-note">No skills in this category yet.</p>}
          {filteredSkills.map((skill, idx) => (
            <div className="skill-card" key={idx}>
              <div className="skill-header">
                <h3>{skill.name}</h3>
                <div className="right">
                  <span className="badge">{getAlert(skill.progress)}</span>
                  <button className="delete-btn" onClick={() => removeSkill(idx)}>✕</button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={skill.progress}
                onChange={(e) => updateProgress(idx, Number(e.target.value))}
              />
              <div className="progress-bar">
                <div className="progress" style={{ width: `${skill.progress}%` }}></div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default SkillTrackerPage;
