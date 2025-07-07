import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ControlHubBackground from '../../components/backgrounds/ControlHubBackground';
import SkillTrackerAnimation from '../../components/animations/SkillTrackerAnimation';
import './SkillDetailPage.css';

const API_URL = 'https://controlhub-backend.onrender.com/api/skills';

function SkillDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [skill, setSkill] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/${id}`)
      .then((res) => {
        setSkill(res.data);
      })
      .catch((err) => {
        console.error('Failed to fetch skill', err);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSkill({ ...skill, [name]: value });
  };

  const handleSliderChange = (e) => {
    setSkill({ ...skill, progress: Number(e.target.value) });
  };

  const handleSave = () => {
    axios.put(`${API_URL}/${id}`, skill)
      .then(() => navigate('/skill-tracker'))
      .catch((err) => console.error('Failed to update skill', err));
  };

  if (!skill) return <div className="skill-detail error">Skill not found</div>;

  return (
    <div className="skill-detail-page">
      <ControlHubBackground />
      <SkillTrackerAnimation />
      <main className="skill-detail-container">
        <h2>Edit Skill</h2>

        <label>Skill Name</label>
        <input
          type="text"
          name="name"
          value={skill.name}
          onChange={handleChange}
        />

        <label>Category</label>
        <select name="category" value={skill.category} onChange={handleChange}>
          <option value="General">General</option>
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="Database">Database</option>
          <option value="DevOps">DevOps</option>
          <option value="Testing">Testing</option>
        </select>

        <label>Progress: {skill.progress}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={skill.progress}
          onChange={handleSliderChange}
        />

        <label>Description</label>
        <textarea
          name="description"
          value={skill.description || ''}
          onChange={handleChange}
          placeholder="Describe your progress or learning notes..."
        />

        <div className="skill-detail-actions">
          <button onClick={handleSave}>Save</button>
          <button onClick={() => navigate('/skill-tracker')}>← Back</button>
        </div>
      </main>
    </div>
  );
}

export default SkillDetailPage;
