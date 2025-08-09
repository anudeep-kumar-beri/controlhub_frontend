// src/pages/FlowWorkspacePage.jsx
import React from 'react';
import FlowCanvas from '../components/flow/FlowCanvas';
import '../pages/flowWorkspace.css';
import ControlHubBackground from '../components/backgrounds/ControlHubBackground';

export default function FlowWorkspacePage() {
  return (
    <div className="flow-workspace-page">
      <ControlHubBackground />
      <FlowCanvas />
    </div>
  );
}
