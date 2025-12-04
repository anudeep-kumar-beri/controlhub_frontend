import React, { useState, useEffect } from 'react';
import WorkspaceControls from './WorkspaceControls';
import WorkspaceTabs from './WorkspaceTabs';
import NodeLibrary from './NodeLibrary';
import FlowControls from './FlowControls';
import ImportExportPanel from './ImportExportPanel';
import NodeConfigurator from './NodeConfigurator';
import SearchFilter from './SearchFilter';
import './sidebar.css';

export default function Sidebar({
  onSettingsChange,
  showGrid,
  snapToGrid,
  showMinimap,
  onExportPDF,
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
            <SearchFilter
              nodes={workspaceData[currentWorkspace]?.nodes || []}
              onNodeSelect={setSelectedNode}
              currentWorkspace={currentWorkspace}
            />
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
            <div className="export-actions">
              <button className="export-pdf-button" onClick={onExportPDF}>
                ⬇ Export Workspace PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}