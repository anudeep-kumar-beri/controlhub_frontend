import React, { useState } from 'react';
import './FlowControls.css';

export default function FlowControls({
  showGrid,
  setShowGrid,
  snapToGrid,
  setSnapToGrid,
  showMinimap,
  setShowMinimap
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flow-controls glass-card">
      <div className="panel-header" onClick={() => setIsOpen(!isOpen)}>
        <span>Flow Controls</span>
        <span className={`arrow ${isOpen ? 'open' : ''}`}>▾</span>
      </div>

      {isOpen && (
        <div className="toggle-group">
          <label className="toggle">
            Show Grid
            <input
              type="checkbox"
              checked={showGrid}
              onChange={() => setShowGrid(!showGrid)}
            />
            <span className="switch"></span>
          </label>

          <label className="toggle">
            Snap to Grid
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={() => setSnapToGrid(!snapToGrid)}
            />
            <span className="switch"></span>
          </label>

          <label className="toggle">
            Show Minimap
            <input
              type="checkbox"
              checked={showMinimap}
              onChange={() => setShowMinimap(!showMinimap)}
            />
            <span className="switch"></span>
          </label>
        </div>
      )}
    </div>
  );
}
