import React from 'react';
import './WorkspaceTabs.css';

export default function WorkspaceTabs({ workspaces, current, onSwitch }) {
  return (
    <div className="workspace-tabs">
      {workspaces.map((ws) => (
        <button
          key={ws}
          className={ws === current ? 'tab active' : 'tab'}
          onClick={() => onSwitch(ws)}
        >
          {ws}
        </button>
      ))}
    </div>
  );
}
