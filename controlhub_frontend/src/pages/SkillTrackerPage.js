import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SkillTrackerPage.css';

const API_URL = 'https://controlhub-backend.onrender.com/api/skills';

function SkillTrackerPage() {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_URL);
        setSkills(res.data);
      } catch (err) {
        setError('Failed to load skills.');
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  const handleAdd = async () => {
    if (!newSkill.trim()) return;
    try {
      setLoading(true);
      const res = await axios.post(API_URL, { name: newSkill });
      setSkills([res.data, ...skills]);
      setNewSkill('');
      setError('');
    } catch (err) {
      setError('Failed to add skill.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/${id}`);
      setSkills(skills.filter(s => s._id !== id));
      setError('');
    } catch (err) {
      setError('Failed to delete skill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="skill-tracker-container">
      <h2>Skill Tracker</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      <div className="add-skill-form">
        <input
          type="text"
          placeholder="Skill name"
          value={newSkill}
          onChange={e => setNewSkill(e.target.value)}
        />
        <button onClick={handleAdd} disabled={loading}>Add</button>
      </div>
      <ul className="skills-list">
        {skills.map(s => (
          <li key={s._id} className="skill-item">
            <span>{s.name}</span>
            <button onClick={() => handleDelete(s._id)} disabled={loading}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SkillTrackerPage;
