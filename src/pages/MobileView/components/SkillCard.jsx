// src/pages/MobileView/components/SkillCard.jsx
import React, { useState } from 'react';
import './SkillCard.css';
import SkillDetail from '../modals/SkillDetail';

export default function SkillCard({ skill }) {
  const [showDetail, setShowDetail] = useState(false);

  const openDetail = (e) => {
    e.stopPropagation();
    setShowDetail(true);
  };
  const closeDetail = () => setShowDetail(false);

  return (
    <>
      <div className="skill-card">
        <div className="skill-card-content">
          <div className="skill-card-header">
            <h3>{skill.name}</h3>
            <span>{skill.progress}%</span>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${skill.progress}%` }}></div>
          </div>

          <div className="skill-card-footer">
            <p>🎯 Goal: {skill.goal || 'N/A'}</p>
            <button className="edit-btn" onClick={openDetail}>Edit / View</button>
          </div>
        </div>
      </div>

      {showDetail && (
        <SkillDetail skill={skill} onClose={closeDetail} />
      )}
    </>
  );
}
