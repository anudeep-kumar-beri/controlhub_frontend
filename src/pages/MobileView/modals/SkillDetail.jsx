// src/pages/MobileView/modals/SkillDetail.jsx
import React, { useState } from 'react';
import './SkillDetail.css';

export default function SkillDetail({ skill, onClose }) {
  const [progress, setProgress] = useState(skill.progress);
  const [goal, setGoal] = useState(skill.goal || '');
  const [note, setNote] = useState('');

  const handleSave = () => {
    // TODO: PATCH to API if needed
    console.log('Saved:', { progress, goal, note });
    onClose();
  };

  return (
    <div className="skill-detail-modal">
      <button className="close-btn" onClick={onClose}>✕</button>
      <h2>{skill.name}</h2>

      <label htmlFor="progress">Progress (%)</label>
      <input
        id="progress"
        type="number"
        value={progress}
        onChange={(e) => setProgress(e.target.value)}
        min="0"
        max="100"
      />

      <label htmlFor="goal">Goal</label>
      <input
        id="goal"
        type="text"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="e.g. Master by Oct 2025"
      />

      <label htmlFor="note">Log / Note</label>
      <textarea
        id="note"
        rows="4"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What's the latest update on this skill?"
      ></textarea>

      <button className="save-btn" onClick={handleSave}>Save Changes</button>
    </div>
  );
}
