import React, { useEffect, useState } from 'react';
import './FlowCanvas.css';

export default function NodeEditModal({ node, onClose, onSubmit, isOpen }) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (node && node.data) {
      setLabel(node.data.label || '');
      setDescription(node.data.description || '');
    }
  }, [node]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ label, description });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modalOverlay">
      <div className="modalContent">
        <h2>Edit Node</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Label:
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </label>
          <label>
            Description:
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <div className="modalActions">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
