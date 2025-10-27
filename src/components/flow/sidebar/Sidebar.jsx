import React, { useState, useEffect } from 'react';
import WorkspaceControls from './WorkspaceControls';
import WorkspaceTabs from './WorkspaceTabs';
import NodeLibrary from './NodeLibrary';
import FlowControls from './FlowControls';
import ImportExportPanel from './ImportExportPanel';
import NodeConfigurator from './NodeConfigurator';
import './sidebar.css';

export default function Sidebar({
  onSettingsChange,
  showGrid,
  snapToGrid,
  showMinimap,
  onWorkspaceAction,
  currentWorkspace,
  workspaces,
  onWorkspaceSwitch,
  wrapperRef,
  workspaceData,
  selectedNode,
  updateNodeData,
  setSelectedNode,
}) {
  const [localGrid, setLocalGrid] = useState(showGrid);
  const [localSnap, setLocalSnap] = useState(snapToGrid);
  const [localMini, setLocalMini] = useState(showMinimap);

  useEffect(() => {
    onSettingsChange('grid', localGrid);
    onSettingsChange('snap', localSnap);
    onSettingsChange('minimap', localMini);
  }, [localGrid, localSnap, localMini, onSettingsChange]);

  return (
    <div className="flow-sidebar">
      <WorkspaceTabs
        workspaces={workspaces}
        current={currentWorkspace}
        onSwitch={onWorkspaceSwitch}
      />
      <WorkspaceControls onWorkspaceAction={onWorkspaceAction} />

      <div className="sidebar">
        {selectedNode ? (
          <NodeConfigurator
            node={selectedNode}
            updateNodeData={updateNodeData}
            onClose={() => setSelectedNode(null)}
          />
        ) : (
          <>
            <NodeLibrary />
            <FlowControls
              showGrid={localGrid}
              setShowGrid={setLocalGrid}
              snapToGrid={localSnap}
              setSnapToGrid={setLocalSnap}
              showMinimap={localMini}
              setShowMinimap={setLocalMini}
            />
            <ImportExportPanel
              wrapperRef={wrapperRef}
              currentWorkspace={currentWorkspace}
              flowData={workspaceData[currentWorkspace]}
            />
          </>
        )}
      </div>
    </div>
  );
}