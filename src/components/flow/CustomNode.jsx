import React from 'react';
import { Handle } from 'reactflow';
import './CustomNode.css';

function CustomNode({ data, selected, dragging }) {
  const nodeClass = `custom-node ${data.nodeType?.toLowerCase() || 'task'}-node ${
    selected ? 'selected' : ''
  } ${dragging ? 'dragging' : ''}`;
  const bgColor = data.bgColor || '#111';
  const handles = data.handles || [];

  // Default handles if none configured
  const defaultHandles = React.useMemo(
    () => [
      { id: 'top', type: 'target', position: 'top' },
      { id: 'bottom', type: 'source', position: 'bottom' },
    ],
    []
  );

  const activeHandles = handles.length > 0 ? handles : defaultHandles;

  return (
    <div className={nodeClass} style={{ backgroundColor: bgColor }}>
      {activeHandles.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type={handle.type}
          position={handle.position}
        />
      ))}
      <div className="node-label">{data.label}</div>
      <div className="node-description">{data.description}</div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default React.memo(CustomNode, (prevProps, nextProps) => {
  return (
    prevProps.data === nextProps.data &&
    prevProps.selected === nextProps.selected &&
    prevProps.dragging === nextProps.dragging
  );
});
