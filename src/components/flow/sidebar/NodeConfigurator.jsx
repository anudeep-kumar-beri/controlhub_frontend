import React, { useState, useEffect } from 'react';
import './NodeConfigurator.css';

export default function NodeConfigurator({ node, updateNodeData, onClose }) {
  const [handles, setHandles] = useState([]);
  const [bgColor, setBgColor] = useState('#1e1e1e');

  useEffect(() => {
    if (node && node.data) {
      const initialHandles = Array.isArray(node.data.handles)
        ? node.data.handles.map((h) => ({
            ...h,
            // Ensure position and type exist with default values
            position: h.position || 'left',
            type: h.type || 'source'
          }))
        : []; 

      setHandles(initialHandles);
      setBgColor(node.data.bgColor || '#1e1e1e');
    }
  }, [node]);

  const addHandle = () => {
    // Add a new handle with default position and type
    setHandles([
      ...handles,
      { id: `h${Date.now()}`, position: 'left', type: 'source' },
    ]);
  };

  const removeHandle = (id) => {
    setHandles(handles.filter((h) => h.id !== id));
  };
  
  const changeHandlePosition = (id, newPosition) => {
    setHandles(
      handles.map((h) => (h.id === id ? { ...h, position: newPosition } : h))
    );
  };

  const changeHandleType = (id, newType) => {
    setHandles(
      handles.map((h) => (h.id === id ? { ...h, type: newType } : h))
    );
  };

  const saveAndClose = () => {
    updateNodeData(node.id, { handles, bgColor });
    onClose();
  };

  return (
    <div className="node-configurator">
      <h3>Node Configurator</h3>

      <div className="config-section">
        <label>Background Color:</label>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
        />
      </div>

      <div className="config-section">
        <label>Handles:</label>
        {Array.isArray(handles) && handles.map((handle) => (
          <div key={handle.id} className="handle-entry">
            <select
              value={handle.position}
              onChange={(e) => changeHandlePosition(handle.id, e.target.value)}
            >
              <option value="top">Top</option>
              <option value="right">Right</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
            </select>
            {/* New handle type dropdown */}
            <select
              value={handle.type}
              onChange={(e) => changeHandleType(handle.id, e.target.value)}
            >
              <option value="source">Source</option>
              <option value="target">Target</option>
            </select>
            <button className="remove-handle-btn" onClick={() => removeHandle(handle.id)}>
              Remove
            </button>
          </div>
        ))}
        <button className="add-handle-btn" onClick={addHandle}>
          + Add Handle
        </button>
      </div>

      <button className="save-button" onClick={saveAndClose}>
        Save & Close
      </button>
    </div>
  );
}