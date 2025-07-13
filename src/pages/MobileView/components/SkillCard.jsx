// src/pages/MobileView/components/SkillCard.jsx
import React, { useState } from 'react';
import './SkillCard.css';
import SkillDetail from '../modals/SkillDetail';

export default function SkillCard({ skills }) {
  const [flipped, setFlipped] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);

  const handleFlip = () => setFlipped(prev => !prev);
  const openDetail = (e, skill) => {
    e.stopPropagation();
    setSelectedSkill(skill);
  };
  const closeDetail = () => setSelectedSkill(null);

  return (
    <>
      <div className={`skill-card ${flipped ? 'flipped' : ''}`} onClick={handleFlip}>
        <div className="card-inner">
          <div className="card-front">
            <h2>Skills Overview</h2>
            {skills.map(skill => (
              <div className="skill-bar-row" key={skill._id}>
                <span>{skill.name}</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${skill.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="card-back">
            <h2>Details</h2>
            {skills.map(skill => (
              <div className="skill-detail-row" key={skill._id}>
                <div>
                  <strong>{skill.name}</strong>
                  <p>Goal: {skill.goal || 'N/A'}</p>
                  <p>Updated: {skill.updatedAt?.slice(0, 10)}</p>
                </div>
                <button onClick={(e) => openDetail(e, skill)}>Edit</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedSkill && (
        <SkillDetail skill={selectedSkill} onClose={closeDetail} />
      )}
    </>
  );
}
