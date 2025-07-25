// FlowCanvas.jsx
import React, { useCallback, useRef, useState, useEffect } from 'react';
import Sidebar from './sidebar/Sidebar';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import './FlowCanvas.css';
import WorkspaceModal from './sidebar/WorkspaceModal';
import ContextMenu from './ContextMenu';

const nodeTypes = { custom: CustomNode };

function FlowCanvasInner({
  wrapperRef,
  showGrid,
  showMinimap,
  snapToGrid,
  currentWorkspace,
  workspaceData,
  setWorkspaceData,
  idCounter,
  setIdCounter
}) {
  const { project } = useReactFlow();
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, nodeId: null });
  const currentNodes = workspaceData[currentWorkspace]?.nodes || [];
  const currentEdges = workspaceData[currentWorkspace]?.edges || [];

  const onNodesChange = useCallback(
    (changes) => {
      setWorkspaceData(prev => ({
        ...prev,
        [currentWorkspace]: {
          ...prev[currentWorkspace],
          nodes: applyNodeChanges(changes, prev[currentWorkspace]?.nodes || [])
        }
      }));
    },
    [currentWorkspace, setWorkspaceData]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      setWorkspaceData(prev => ({
        ...prev,
        [currentWorkspace]: {
          ...prev[currentWorkspace],
          edges: applyEdgeChanges(changes, prev[currentWorkspace]?.edges || [])
        }
      }));
    },
    [currentWorkspace, setWorkspaceData]
  );

  const onConnect = useCallback(
    (connection) => {
      setWorkspaceData(prev => ({
        ...prev,
        [currentWorkspace]: {
          ...prev[currentWorkspace],
          edges: addEdge({ ...connection, animated: true }, prev[currentWorkspace]?.edges || [])
        }
      }));
    },
    [currentWorkspace, setWorkspaceData]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const nodeDataStr = event.dataTransfer.getData('application/reactflow');
    if (!nodeDataStr) return;

    let template;
    try {
      template = JSON.parse(nodeDataStr);
    } catch (e) {
      console.error("Invalid node data:", e);
      return;
    }

    const bounds = wrapperRef.current.getBoundingClientRect();
    const position = project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });

    const newNode = {
      id: `${template.nodeType}_${Date.now()}`,
      type: 'custom',
      position,
      data: {
        label: template.label,
        description: template.description,
        nodeType: template.nodeType,
      },
    };

    setIdCounter((prev) => prev + 1);
    setWorkspaceData(prev => ({
      ...prev,
      [currentWorkspace]: {
        ...prev[currentWorkspace],
        nodes: [...(prev[currentWorkspace]?.nodes || []), newNode],
      }
    }));
  }, [currentWorkspace, project, setIdCounter, setWorkspaceData, wrapperRef]);

  const handleNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    });
  }, []);

  const handleContextAction = useCallback((action) => {
    setWorkspaceData(prev => {
      const nodes = [...prev[currentWorkspace].nodes];
      const edges = [...prev[currentWorkspace].edges];

      if (action === 'delete') {
        const filteredNodes = nodes.filter(n => n.id !== contextMenu.nodeId);
        const filteredEdges = edges.filter(e => e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId);
        return {
          ...prev,
          [currentWorkspace]: {
            nodes: filteredNodes,
            edges: filteredEdges
          }
        };
      }

      if (action === 'duplicate') {
        const originalNode = nodes.find(n => n.id === contextMenu.nodeId);
        if (!originalNode) return prev;

        const newNode = {
          ...originalNode,
          id: `${originalNode.id}_copy_${Date.now()}`,
          position: {
            x: originalNode.position.x + 40,
            y: originalNode.position.y + 40,
          }
        };

        return {
          ...prev,
          [currentWorkspace]: {
            ...prev[currentWorkspace],
            nodes: [...nodes, newNode],
          }
        };
      }

      if (action === 'edit') {
        alert('Edit functionality to be implemented.');
      }

      return prev;
    });

    setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
  }, [currentWorkspace, contextMenu.nodeId, setWorkspaceData]);

  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu.visible]);

  return (
    <div onDrop={onDrop} onDragOver={onDragOver} style={{ width: '100%', height: '100%' }}>
      {contextMenu.visible && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onAction={handleContextAction} />
      )}
      <ReactFlow
        nodes={currentNodes}
        edges={currentEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        snapToGrid={snapToGrid}
        snapGrid={[16, 16]}
        onNodeContextMenu={handleNodeContextMenu}
      >
        <defs>
          <filter id="glow">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#66f" />
          </filter>
        </defs>
        {showGrid && <Background color="#ffffff22" gap={16} />}
        {showMinimap && <MiniMap />}
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default function FlowCanvas() {
  const wrapperRef = useRef(null);

  const [workspaceData, setWorkspaceData] = useState({ Default: { nodes: [], edges: [] } });
  const [idCounter, setIdCounter] = useState(1);
  const [workspaces, setWorkspaces] = useState(['Default']);
  const [currentWorkspace, setCurrentWorkspace] = useState('Default');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('');
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);

  const handleAddNode = useCallback(() => {
    const newNodeId = `node-${idCounter}`;
    const newNode = {
      id: newNodeId,
      type: 'custom',
      position: {
        x: 150 + (workspaceData[currentWorkspace]?.nodes.length || 0) * 50,
        y: 150 + (workspaceData[currentWorkspace]?.nodes.length || 0) * 30,
      },
      data: {
        label: 'New Node',
        description: 'Editable node',
        nodeType: 'default',
      },
    };

    setIdCounter((prev) => prev + 1);
    setWorkspaceData(prev => ({
      ...prev,
      [currentWorkspace]: {
        ...prev[currentWorkspace],
        nodes: [...(prev[currentWorkspace]?.nodes || []), newNode],
      }
    }));
  }, [idCounter, workspaceData, currentWorkspace]);

  const handleModalSubmit = useCallback((name) => {
    if (modalMode === 'create') {
      setWorkspaces(prev => [...prev, name]);
      setWorkspaceData(prev => ({
        ...prev,
        [name]: { nodes: [], edges: [] },
      }));
      setCurrentWorkspace(name);
    } else if (modalMode === 'rename') {
      const newWorkspaces = workspaces.map(ws => ws === currentWorkspace ? name : ws);
      const updatedData = {
        ...workspaceData,
        [name]: workspaceData[currentWorkspace],
      };
      delete updatedData[currentWorkspace];
      setWorkspaces(newWorkspaces);
      setWorkspaceData(updatedData);
      setCurrentWorkspace(name);
    } else if (modalMode === 'switch') {
      if (workspaces.includes(name)) {
        setCurrentWorkspace(name);
      } else {
        alert('Workspace not found.');
      }
    } else if (modalMode === 'delete') {
      if (workspaces.length > 1) {
        const updatedWorkspaces = workspaces.filter(ws => ws !== currentWorkspace);
        const { [currentWorkspace]: _, ...rest } = workspaceData;
        setWorkspaces(updatedWorkspaces);
        setWorkspaceData(rest);
        setCurrentWorkspace(updatedWorkspaces[0]);
      } else {
        alert('Cannot delete the only workspace.');
      }
    }
    setModalOpen(false);
  }, [modalMode, workspaces, currentWorkspace, workspaceData]);

  return (
    <div className="canvasWrapper">
      <WorkspaceModal
        mode={modalMode}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        currentName={currentWorkspace}
        existingNames={workspaces}
      />

      <Sidebar
        onSettingsChange={(type, value) => {
          if (type === 'grid') setShowGrid(value);
          if (type === 'snap') setSnapToGrid(value);
          if (type === 'minimap') setShowMinimap(value);
        }}
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        showMinimap={showMinimap}
        onWorkspaceAction={(mode) => {
          setModalMode(mode);
          setModalOpen(true);
        }}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onWorkspaceSwitch={(name) => setCurrentWorkspace(name)}
      />

      <div className="canvasArea flow-wrapper" ref={wrapperRef}>
        <div className="addNodeButtonContainer">
          <button className="addNodeButton" onClick={handleAddNode}>
            ＋ Node
          </button>
        </div>

        <ReactFlowProvider>
          <FlowCanvasInner
            wrapperRef={wrapperRef}
            showGrid={showGrid}
            showMinimap={showMinimap}
            snapToGrid={snapToGrid}
            currentWorkspace={currentWorkspace}
            workspaceData={workspaceData}
            setWorkspaceData={setWorkspaceData}
            idCounter={idCounter}
            setIdCounter={setIdCounter}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}