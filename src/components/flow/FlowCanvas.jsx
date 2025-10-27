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
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import './FlowCanvas.css';
import WorkspaceModal from './sidebar/WorkspaceModal';
import ContextMenu from './ContextMenu';
import api from '../../api'; // <-- Add API import

// Define custom node types
const nodeTypes = { custom: CustomNode };

// ------------------------- Node Edit Modal -------------------------
function NodeEditModal({ isOpen, onClose, onSubmit, node }) {
  const [label, setLabel] = useState(node?.data?.label || '');
  const [description, setDescription] = useState(node?.data?.description || '');

  useEffect(() => {
    if (node) {
      setLabel(node.data.label);
      setDescription(node.data.description);
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
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} required />
          </label>
          <label>
            Description:
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="modalActions">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ------------------------- Flow Canvas Inner -------------------------
// ... (all other imports and components remain the same)

// ------------------------- Flow Canvas Inner -------------------------
function FlowCanvasInner({
  wrapperRef,
  showGrid,
  showMinimap,
  snapToGrid,
  currentWorkspace,
  workspaceData,
  setWorkspaceData,
  idCounter,
  setIdCounter,
  setSelectedNode,
}) {
  const { project } = useReactFlow();
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, nodeId: null });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  // Ensure all edges are animated
  const currentNodes = workspaceData[currentWorkspace]?.nodes || [];
  const currentEdges = (workspaceData[currentWorkspace]?.edges || []).map(edge => ({
    ...edge,
    animated: true,
  }));

  const onNodesChange = useCallback(
    (changes) => {
      setWorkspaceData((prev) => ({
        ...prev,
        [currentWorkspace]: {
          ...prev[currentWorkspace],
          nodes: applyNodeChanges(changes, prev[currentWorkspace]?.nodes || []),
        },
      }));
    },
    [currentWorkspace, setWorkspaceData]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      setWorkspaceData((prev) => ({
        ...prev,
        [currentWorkspace]: {
          ...prev[currentWorkspace],
          edges: applyEdgeChanges(changes, prev[currentWorkspace]?.edges || []),
        },
      }));
    },
    [currentWorkspace, setWorkspaceData]
  );

  const onConnect = useCallback(
    (connection) => {
      setWorkspaceData((prev) => ({
        ...prev,
        [currentWorkspace]: {
          ...prev[currentWorkspace],
          edges: addEdge(connection, prev[currentWorkspace]?.edges || []),
        },
      }));
    },
    [currentWorkspace, setWorkspaceData]
  );

  const onNodeClick = useCallback(
    (event, node) => {
      setSelectedNode(node);
      setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
  }, [setSelectedNode]);

  const handleNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY, nodeId: node.id });
  }, []);

  const handleEditSubmit = ({ label, description }) => {
    setWorkspaceData((prev) => {
      const nodes = [...prev[currentWorkspace].nodes];
      const index = nodes.findIndex((n) => n.id === editingNode.id);
      if (index === -1) return prev;
      nodes[index] = {
        ...nodes[index],
        data: { ...nodes[index].data, label, description },
      };
      return {
        ...prev,
        [currentWorkspace]: {
          ...prev[currentWorkspace],
          nodes,
        },
      };
    });
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const nodeDataStr = event.dataTransfer.getData('application/reactflow');
      if (!nodeDataStr) return;

      let template;
      try {
        template = JSON.parse(nodeDataStr);
      } catch (e) {
        console.error('Invalid node data:', e);
        return;
      }

      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });

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
      setWorkspaceData((prev) => ({
        ...prev,
        [currentWorkspace]: {
          ...prev[currentWorkspace],
          nodes: [...(prev[currentWorkspace]?.nodes || []), newNode],
        },
      }));
    },
    [currentWorkspace, setWorkspaceData, setIdCounter, project, wrapperRef]
  );

  // --- Backend Sync: Fetch workspace data on workspace change ---
  useEffect(() => {
    async function fetchFlow() {
      try {
        const res = await api.get(`/flow/${encodeURIComponent(currentWorkspace)}`);
        setWorkspaceData(prev => ({
          ...prev,
          [currentWorkspace]: {
            nodes: res.data.nodes || [],
            edges: res.data.edges || [],
          }
        }));
      } catch (err) {
        // If not found, initialize empty
        setWorkspaceData(prev => ({
          ...prev,
          [currentWorkspace]: { nodes: [], edges: [] }
        }));
      }
    }
    fetchFlow();
    // eslint-disable-next-line
  }, [currentWorkspace]);

  // --- Backend Sync: Save workspace data on nodes/edges change ---
  useEffect(() => {
    async function saveFlow() {
      const data = workspaceData[currentWorkspace];
      if (!data) return;
      try {
        await api.post(`/flow/${encodeURIComponent(currentWorkspace)}`, {
          nodes: data.nodes,
          edges: data.edges,
        });
      } catch (err) {
        // Optionally handle save error
      }
    }
    saveFlow();
    // eslint-disable-next-line
  }, [workspaceData, currentWorkspace]);

  useEffect(() => {
    const handleClick = () => {
      if (contextMenu?.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu]);

  return (
    <div
      className="canvasArea flow-wrapper"
      ref={wrapperRef}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <div className="addNodeButtonContainer">
        <button
          className="addNodeButton"
          onClick={() => {
            const newNode = {
              id: `node-${idCounter}`,
              type: 'custom',
              position: {
                x: 150 + currentNodes.length * 50,
                y: 150 + currentNodes.length * 30,
              },
              data: {
                label: 'New Node',
                description: 'Editable node',
                nodeType: 'default',
              },
            };
            setIdCounter((prev) => prev + 1);
            setWorkspaceData((prev) => ({
              ...prev,
              [currentWorkspace]: {
                ...prev[currentWorkspace],
                nodes: [...currentNodes, newNode],
              },
            }));
          }}
        >
          ＋ Node
        </button>
      </div>

      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          workspaceData={workspaceData}
          currentWorkspace={currentWorkspace}
          setWorkspaceData={setWorkspaceData}
          setEditModalOpen={setEditModalOpen}
          setEditingNode={setEditingNode}
          setContextMenu={setContextMenu}
          setIdCounter={setIdCounter}
          setSelectedNode={setSelectedNode}
        />
      )}

      <NodeEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingNode(null);
        }}
        onSubmit={handleEditSubmit}
        node={editingNode}
      />

      <ReactFlow
        nodes={currentNodes}
        edges={currentEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        snapToGrid={snapToGrid}
        snapGrid={[16, 16]}
        onNodeContextMenu={handleNodeContextMenu}
        proOptions={{ hideAttribution: true }}
        onMove={() => setContextMenu({ visible: false, x: 0, y: 0, nodeId: null })}
        
      >
        <defs>
          <filter id="glow">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#66f" />
          </filter>
        </defs>
        {showGrid && <Background color="#ffffff22" gap={16} />}
        {showMinimap && (
          <MiniMap
            nodeColor={() => '#ffffff'}
            nodeStrokeWidth={1}
            maskColor="rgba(0, 0, 0, 0.3)"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            zoomable
            pannable
          />
        )}
        <Controls />
      </ReactFlow>
    </div>
  );
}



// ------------------------- Root Canvas Export -------------------------
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

  // State to store selected node for the sidebar configurator
  const [selectedNode, setSelectedNode] = useState(null);

  // Function to apply changes from the sidebar NodeConfigurator
  const updateNodeData = (nodeId, newData) => {
    setWorkspaceData(prev => ({
      ...prev,
      [currentWorkspace]: {
        ...prev[currentWorkspace],
        nodes: prev[currentWorkspace].nodes.map(n =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n
        )
      }
    }));
  };

  const handleModalSubmit = (name) => {
    if (modalMode === 'create') {
      setWorkspaces((prev) => [...prev, name]);
      setWorkspaceData((prev) => ({ ...prev, [name]: { nodes: [], edges: [] } }));
      setCurrentWorkspace(name);
    } else if (modalMode === 'rename') {
      const updated = {
        ...workspaceData,
        [name]: workspaceData[currentWorkspace],
      };
      delete updated[currentWorkspace];
      setWorkspaces((prev) => prev.map((ws) => (ws === currentWorkspace ? name : ws)));
      setWorkspaceData(updated);
      setCurrentWorkspace(name);
    } else if (modalMode === 'switch') {
      if (workspaces.includes(name)) setCurrentWorkspace(name);
      else alert('Workspace not found.');
    } else if (modalMode === 'delete') {
      if (workspaces.length > 1) {
        const filtered = workspaces.filter((ws) => ws !== currentWorkspace);
        const { [currentWorkspace]: _, ...rest } = workspaceData;
        setWorkspaces(filtered);
        setWorkspaceData(rest);
        setCurrentWorkspace(filtered[0]);
      } else {
        alert('Cannot delete the only workspace.');
      }
    }
    setModalOpen(false);
  };

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
        wrapperRef={wrapperRef}
        workspaceData={workspaceData}
        selectedNode={selectedNode}
        updateNodeData={updateNodeData}
        setSelectedNode={setSelectedNode}
      />
      
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
          setSelectedNode={setSelectedNode}
        />
      </ReactFlowProvider>
    </div>
  );
}