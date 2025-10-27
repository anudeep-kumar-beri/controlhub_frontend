import React from 'react';
import { Handle } from 'reactflow';
import './CustomNode.css';

export default function CustomNode({ data }) {
  const nodeClass = `custom-node ${data.nodeType?.toLowerCase() || 'task'}-node`;

  return (
    <div className={nodeClass}>
      <Handle type="target" position="top" />
      <div className="node-label">{data.label}</div>
      <div className="node-description">{data.description}</div>
      <Handle type="source" position="bottom" />
    </div>
  );
}
