import React from 'react';
import './skillTrackerAnimation.css';

export default function SkillTrackerAnimation() {
  return (
    <div className="skill-ripple-overlay">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="ripple-circle" style={{ animationDelay: `${i * 2}s` }} />
      ))}
    </div>
  );
}
