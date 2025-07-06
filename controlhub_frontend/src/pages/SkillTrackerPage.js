import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SkillTrackerPage.css';

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
    <div className="skill-tracker-container">
      <h2>Skill Tracker</h2>
      <input
        type="text"
        placeholder="Skill name"
        value={newSkill}
        onChange={e => setNewSkill(e.target.value)}
      />
      <input
        type="number"
        placeholder="Progress"
        value={newProgress}
        onChange={e => setNewProgress(Number(e.target.value))}
      />
      <select value={category} onChange={e => setCategory(e.target.value)}>
        <option value="General">General</option>
        <option value="Frontend">Frontend</option>
        <option value="Backend">Backend</option>
        <option value="Database">Database</option>
        <option value="DevOps">DevOps</option>
        <option value="Testing">Testing</option>
      </select>
      <button onClick={addSkill}>＋</button>
      <input
        type="text"
        placeholder="Search skills"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
        <option value="All">All Categories</option>
        <option value="Frontend">Frontend</option>
        <option value="Backend">Backend</option>
        <option value="Database">Database</option>
        <option value="DevOps">DevOps</option>
        <option value="Testing">Testing</option>
        <option value="General">General</option>
      </select>
      <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
        <option value="Default">Sort</option>
        <option value="A-Z">A → Z</option>
        <option value="Z-A">Z → A</option>
        <option value="High-Low">High → Low</option>
        <option value="Low-High">Low → High</option>
      </select>
      <div>📈 Average Skill Level: <b>{average}%</b></div>
      <ul>
        {filteredSortedSkills().map((skill, idx) => (
          <li key={skill._id}>
            {skill.name} – {skill.progress}% {getAlert(skill.progress)}
            <button onClick={() => removeSkill(idx)}>✕</button>
            <input
              type="number"
              value={skill.progress}
              onChange={e => updateProgress(idx, Number(e.target.value))}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SkillTrackerPage;
