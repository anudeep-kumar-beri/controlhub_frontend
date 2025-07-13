// src/pages/MobileView/components/SkillCard.jsx
import React, { useState } from 'react';
import './SkillCard.css';
import SkillDetail from '../modals/SkillDetail';

export default function SkillCard({ skill }) {
  const [flipped, setFlipped] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const handleFlip = () => setFlipped(prev => !prev);
  const openDetail = (e) => {
    e.stopPropagation(); // prevent triggering flip
    setShowDetail(true);
  };
  const closeDetail = () => setShowDetail(false);

  return (
    <>
      <div className={`skill-card ${flipped ? 'flipped' : ''}`} onClick={handleFlip}>
        <div className="card-inner">
          <div className="card-front">
            <h3>{skill.name}</h3>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${skill.progress}%` }}></div>
            </div>
            <p>{skill.progress}%</p>
          </div>

          <div className="card-back">
            <p>Goal: {skill.goal || 'N/A'}</p>
            <p>Last Updated: {skill.updatedAt?.slice(0, 10)}</p>
            <button onClick={openDetail}>Edit / View</button>
          </div>
        </div>
      </div>

      {showDetail && (
        <SkillDetail
          skill={skill}
          onClose={closeDetail}
        />
      )}
    </>
  );
}
