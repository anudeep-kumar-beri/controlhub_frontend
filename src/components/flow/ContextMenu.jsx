import React from 'react';
import './ContextMenu.css';

export default function ContextMenu({
  x,
  y,
  nodeId,
  workspaceData,
  setWorkspaceData,
  currentWorkspace,
  setEditingNode,
  setEditModalOpen,
  setContextMenu,
  setIdCounter,
  setSelectedNode,
}) {
  const handleAction = (action) => {
    if (!nodeId) return;

    const currentNodes = workspaceData[currentWorkspace]?.nodes || [];
    const nodeToActOn = currentNodes.find((node) => node.id === nodeId);
    const currentEdges = workspaceData[currentWorkspace]?.edges || [];

    if (action === 'delete') {
      const filteredNodes = currentNodes.filter((node) => node.id !== nodeId);
      const filteredEdges = currentEdges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );
      setWorkspaceData((prev) => ({
        ...prev,
        [currentWorkspace]: {
          ...prev[currentWorkspace],
          nodes: filteredNodes,
          edges: filteredEdges,
        },
      }));
    }

    if (action === 'edit') {
      if (nodeToActOn) {
        setEditingNode(nodeToActOn);
        setEditModalOpen(true);
      }
    }

    if (action === 'configure') {
      if (nodeToActOn) {
        setSelectedNode(nodeToActOn);
      }
    }

    if (action === 'duplicate') {
      if (nodeToActOn) {
        const newId = `node-${Date.now()}`;
        const newNode = {
          ...nodeToActOn,
          id: newId,
          position: {
            x: nodeToActOn.position.x + 40,
            y: nodeToActOn.position.y + 40,
          },
        };
        setWorkspaceData((prev) => ({
          ...prev,
          [currentWorkspace]: {
            ...prev[currentWorkspace],
            nodes: [...currentNodes, newNode],
          },
        }));
        setIdCounter((prev) => prev + 1);
      }
    }

    setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
  };

  return (
    <div className="context-menu" style={{ top: y, left: x }}>
      <button onClick={() => handleAction('edit')}>Edit</button>
      <button onClick={() => handleAction('configure')}>Configure Node</button>
      <button onClick={() => handleAction('delete')}>Delete</button>
      <button onClick={() => handleAction('duplicate')}>Duplicate</button>
    </div>
  );
}