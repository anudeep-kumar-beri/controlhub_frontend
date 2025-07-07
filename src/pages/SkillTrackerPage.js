import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SkillTrackerPage.css';
import ControlHubBackground from "../components/backgrounds/ControlHubBackground";
import SkillTrackerAnimation from "../components/animations/SkillTrackerAnimation";
import "../components/animations/skillTrackerAnimation.css";

const API_URL = 'https://controlhub-backend.onrender.com/api/skills';

function SkillTrackerPage() {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [newProgress, setNewProgress] = useState(0);
  const [category, setCategory] = useState('General');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('Default');

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const res = await axios.get(API_URL);
      setSkills(res.data);
    } catch (err) {
      console.error('Failed to load skills', err);
    }
  };

  const addSkill = async () => {
    if (newSkill.trim() === '') return;
    try {
      const res = await axios.post(API_URL, {
        name: newSkill.trim(),
        progress: newProgress,
        category
      });
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
      const updated = skills.filter((_, i) => i !== index);
      setSkills(updated);
    } catch (err) {
      console.error('Error deleting skill', err);
    }
  };

  const getAlert = (progress) => {
    if (progress < 30) return '🔴 Beginner';
    if (progress < 70) return '🟡 Intermediate';
    if (progress < 100) return '🟢 Advanced';
    return '✅ Mastered';
  };

  const average =
    skills.length === 0
      ? 0
      : Math.round(skills.reduce((sum, s) => sum + s.progress, 0) / skills.length);

  const filteredSortedSkills = () => {
    let filtered = [...skills];
    if (filterCategory !== 'All') {
      filtered = filtered.filter(skill => skill.category === filterCategory);
    }
    if (searchTerm.trim()) {
      filtered = filtered.filter(skill =>
        skill.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (sortOrder === 'A-Z') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'Z-A') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOrder === 'High-Low') {
      filtered.sort((a, b) => b.progress - a.progress);
    } else if (sortOrder === 'Low-High') {
      filtered.sort((a, b) => a.progress - b.progress);
    }
    return filtered;
  };

  return (
    <div className="skill-page relative min-h-screen bg-black text-white overflow-hidden">
  <ControlHubBackground />
<SkillTrackerAnimation />
<main className="relative z-10">
      <h1>Skill Tracker</h1>
      <div className="skill-add-form">
        <input
          type="text"
          className="input-dark"
          placeholder="Skill Name"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
        />
        <input
          type="number"
          className="input-dark"
          placeholder="%"
          value={newProgress}
          min="0"
          max="100"
          onChange={(e) => setNewProgress(Number(e.target.value))}
        />
        <select
          className="input-dark"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="General">General</option>
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="Database">Database</option>
          <option value="DevOps">DevOps</option>
          <option value="Testing">Testing</option>
        </select>
        <button className="neon-add" onClick={addSkill}>＋</button>
      </div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <input
          type="text"
          className="input-dark"
          placeholder="Search skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <select className="input-dark" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="All">All Categories</option>
            <option value="Frontend">Frontend</option>
            <option value="Backend">Backend</option>
            <option value="Database">Database</option>
            <option value="DevOps">DevOps</option>
            <option value="Testing">Testing</option>
            <option value="General">General</option>
          </select>
          <select className="input-dark" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="Default">Sort</option>
            <option value="A-Z">A → Z</option>
            <option value="Z-A">Z → A</option>
            <option value="High-Low">High → Low</option>
            <option value="Low-High">Low → High</option>
          </select>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#0f0' }}>
          📈 Average Skill Level: <strong>{average}%</strong>
        </p>
      </div>
      <div className="skill-list">
        {filteredSortedSkills().map((skill, idx) => (
          <div className="skill-item glow-hover" key={idx}>
            <div className="skill-header">
              <label>
                {skill.name} – {skill.progress}% <span className="badge">{getAlert(skill.progress)}</span>
              </label>
              <button className="neon-delete" onClick={() => removeSkill(idx)}>✕</button>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={skill.progress}
              onChange={(e) => updateProgress(idx, Number(e.target.value))}
            />
            <div className="progress-bar">
              <div
                className="progress"
                style={{ width: `${skill.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
          </main>
    </div>
  );
}

export default SkillTrackerPage;
