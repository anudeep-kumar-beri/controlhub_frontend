import React, { useState, useEffect } from 'react';
import './WorkspaceModal.css';

export default function WorkspaceModal({ mode, isOpen, onClose, onSubmit, currentName, existingNames }) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (mode === 'rename') {
      setName(currentName);
    } else {
      setName('');
    }
  }, [mode, currentName]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (mode === 'delete') {
      onSubmit(); // no name needed
    } else if (name.trim() && !existingNames.includes(name.trim())) {
      onSubmit(name.trim());
    }
  };

  const titleMap = {
    create: 'Create Workspace',
    rename: 'Rename Workspace',
    switch: 'Switch Workspace',
    delete: `Delete Workspace "${currentName}"?`,
  };

  return (
    <div className="modalBackdrop">
      <div className="modalBox">
        <h2>{titleMap[mode]}</h2>

        {(mode === 'create' || mode === 'rename' || mode === 'switch') && (
          <input
            className="modalInput"
            type="text"
            value={name}
            placeholder="Workspace name"
            onChange={(e) => setName(e.target.value)}
          />
        )}

        {mode === 'delete' && (
          <p className="modalText">This action cannot be undone.</p>
        )}

        <div className="modalActions">
          <button onClick={onClose} className="modalCancel">Cancel</button>
          <button onClick={handleConfirm} className="modalConfirm">
            {mode === 'delete' ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
