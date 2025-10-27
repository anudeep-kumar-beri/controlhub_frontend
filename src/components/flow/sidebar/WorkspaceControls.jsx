import React from 'react';
import './WorkspaceControls.css';

export default function WorkspaceControls({ onWorkspaceAction }) {
  return (
    <div className="workspace-controls">
      <h4>Workspace Controls</h4>
      <button onClick={() => onWorkspaceAction('create')}>Create New</button>
      <button onClick={() => onWorkspaceAction('rename')}>Rename</button>
      
      <button onClick={() => onWorkspaceAction('delete')}>Delete</button>
    </div>
  );
}
