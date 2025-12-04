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
import SmoothEdge from './SmoothEdge';
import './FlowCanvas.css';
import WorkspaceModal from './sidebar/WorkspaceModal';
import ContextMenu from './ContextMenu';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import PerformanceMonitor from './PerformanceMonitor';
import api from '../../api';

// Define custom node and edge types for performance
const nodeTypes = { custom: CustomNode };
const edgeTypes = { smooth: SmoothEdge };

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
  saveStatus,
  setSaveStatus,
  showPerformance,
  setShowPerformance,
}) {
  const { project } = useReactFlow();
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, nodeId: null });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [copiedData, setCopiedData] = useState(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const saveTimeoutRef = useRef(null);
  const historyRef = useRef({ past: [], future: [] });
  const interactionTimeoutRef = useRef(null);
  const rafIdRef = useRef(null);
  // Ensure all edges are animated
  const currentNodes = React.useMemo(
    () => workspaceData[currentWorkspace]?.nodes || [],
    [workspaceData, currentWorkspace]
  );
  const currentEdges = React.useMemo(
    () => (workspaceData[currentWorkspace]?.edges || []).map(edge => ({
      ...edge,
      type: 'smooth',
      animated: !isInteracting, // Disable animation during interaction for performance
      style: {
        stroke: '#0ff',
        strokeWidth: 2,
      },
    })),
    [workspaceData, currentWorkspace, isInteracting]
  );

  // Save to history before making changes (throttled for performance)
  const saveHistory = useCallback(() => {
    // Use RAF for smooth 60fps history saves
    if (rafIdRef.current) return;
    
    rafIdRef.current = requestAnimationFrame(() => {
      const currentState = {
        nodes: JSON.parse(JSON.stringify(currentNodes)),
        edges: JSON.parse(JSON.stringify(currentEdges)),
      };
      historyRef.current.past.push(currentState);
      historyRef.current.future = []; // Clear future on new action
      // Limit history to 50 items
      if (historyRef.current.past.length > 50) {
        historyRef.current.past.shift();
      }
      rafIdRef.current = null;
    });
  }, [currentNodes, currentEdges]);

  const onNodesChange = useCallback(
    (changes) => {
      // Track interaction state for smooth rendering
      setIsInteracting(true);
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
      interactionTimeoutRef.current = setTimeout(() => {
        setIsInteracting(false);
      }, 150);

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

  const onSelectionChange = useCallback(({ nodes }) => {
    setSelectedNodes(nodes);
  }, []);

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

  const onNodeDragStart = useCallback(() => {
    setIsInteracting(true);
  }, []);

  const onNodeDragStop = useCallback(() => {
    setIsInteracting(false);
    saveHistory();
  }, [saveHistory]);

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
    let isMounted = true;
    async function fetchFlow() {
      setIsLoading(true);
      setSaveStatus('loading');
      try {
        const res = await api.get(`/flow/${encodeURIComponent(currentWorkspace)}`);
        if (isMounted) {
          setWorkspaceData(prev => ({
            ...prev,
            [currentWorkspace]: {
              nodes: res.data.nodes || [],
              edges: res.data.edges || [],
            }
          }));
          setSaveStatus('saved');
        }
      } catch (err) {
        // If not found, initialize empty
        if (isMounted) {
          setWorkspaceData(prev => ({
            ...prev,
            [currentWorkspace]: { nodes: [], edges: [] }
          }));
          setSaveStatus('saved');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    fetchFlow();
    return () => {
      isMounted = false;
    };
  }, [currentWorkspace, setWorkspaceData, setSaveStatus]);

  // --- Backend Sync: Debounced save workspace data on nodes/edges change ---
  useEffect(() => {
    const data = workspaceData[currentWorkspace];
    if (!data || !data.nodes) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set status to unsaved
    setSaveStatus('unsaved');

    // Debounce save for 1 second
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await api.post('/flow/save', {
          workspaceName: currentWorkspace,
          nodes: data.nodes,
          edges: data.edges,
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Save error:', err);
        setSaveStatus('error');
      }
    }, 1000);

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [workspaceData, currentWorkspace, setSaveStatus]);

  // Undo functionality
  const undo = useCallback(() => {
    if (historyRef.current.past.length === 0) return;
    
    const currentState = {
      nodes: JSON.parse(JSON.stringify(currentNodes)),
      edges: JSON.parse(JSON.stringify(currentEdges)),
    };
    historyRef.current.future.push(currentState);
    
    const previousState = historyRef.current.past.pop();
    setWorkspaceData(prev => ({
      ...prev,
      [currentWorkspace]: previousState,
    }));
  }, [currentNodes, currentEdges, currentWorkspace, setWorkspaceData]);

  // Redo functionality
  const redo = useCallback(() => {
    if (historyRef.current.future.length === 0) return;
    
    const currentState = {
      nodes: JSON.parse(JSON.stringify(currentNodes)),
      edges: JSON.parse(JSON.stringify(currentEdges)),
    };
    historyRef.current.past.push(currentState);
    
    const nextState = historyRef.current.future.pop();
    setWorkspaceData(prev => ({
      ...prev,
      [currentWorkspace]: nextState,
    }));
  }, [currentNodes, currentEdges, currentWorkspace, setWorkspaceData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y or Cmd+Shift+Z or Cmd+Y
      if ((e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key === 'z') || e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }

      // Delete: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodes.length > 0) {
        e.preventDefault();
        saveHistory();
        const nodeIds = selectedNodes.map(n => n.id);
        const filteredNodes = currentNodes.filter(n => !nodeIds.includes(n.id));
        const filteredEdges = currentEdges.filter(
          e => !nodeIds.includes(e.source) && !nodeIds.includes(e.target)
        );
        setWorkspaceData(prev => ({
          ...prev,
          [currentWorkspace]: {
            nodes: filteredNodes,
            edges: filteredEdges,
          },
        }));
        setSelectedNodes([]);
        return;
      }

      // Copy: Ctrl+C or Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedNodes.length > 0) {
        e.preventDefault();
        setCopiedData({
          nodes: selectedNodes.map(n => ({ ...n })),
          timestamp: Date.now(),
        });
        return;
      }

      // Cut: Ctrl+X or Cmd+X
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectedNodes.length > 0) {
        e.preventDefault();
        saveHistory();
        setCopiedData({
          nodes: selectedNodes.map(n => ({ ...n })),
          timestamp: Date.now(),
        });
        const nodeIds = selectedNodes.map(n => n.id);
        const filteredNodes = currentNodes.filter(n => !nodeIds.includes(n.id));
        const filteredEdges = currentEdges.filter(
          e => !nodeIds.includes(e.source) && !nodeIds.includes(e.target)
        );
        setWorkspaceData(prev => ({
          ...prev,
          [currentWorkspace]: {
            nodes: filteredNodes,
            edges: filteredEdges,
          },
        }));
        setSelectedNodes([]);
        return;
      }

      // Paste: Ctrl+V or Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedData) {
        e.preventDefault();
        saveHistory();
        const pastedNodes = copiedData.nodes.map(node => ({
          ...node,
          id: `${node.id}_copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
          },
          selected: true,
        }));
        setWorkspaceData(prev => ({
          ...prev,
          [currentWorkspace]: {
            ...prev[currentWorkspace],
            nodes: [...currentNodes, ...pastedNodes],
          },
        }));
        return;
      }

      // Select All: Ctrl+A or Cmd+A
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allNodes = currentNodes.map(n => ({ ...n, selected: true }));
        setWorkspaceData(prev => ({
          ...prev,
          [currentWorkspace]: {
            ...prev[currentWorkspace],
            nodes: allNodes,
          },
        }));
        return;
      }

      // Duplicate: Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedNodes.length > 0) {
        e.preventDefault();
        saveHistory();
        const duplicatedNodes = selectedNodes.map(node => ({
          ...node,
          id: `${node.id}_dup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
          },
          selected: true,
        }));
        setWorkspaceData(prev => ({
          ...prev,
          [currentWorkspace]: {
            ...prev[currentWorkspace],
            nodes: [...currentNodes, ...duplicatedNodes],
          },
        }));
        return;
      }

      // Show shortcuts help: ?
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        setShowShortcutsHelp(prev => !prev);
        return;
      }

      // Performance monitor toggle: Ctrl+Shift+P (dev only)
      if (e.key === 'p' && e.shiftKey && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowPerformance(prev => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, currentNodes, currentEdges, copiedData, currentWorkspace, setWorkspaceData, undo, redo, saveHistory, setShowPerformance]);

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
      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading workspace...</p>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp 
        isOpen={showShortcutsHelp} 
        onClose={() => setShowShortcutsHelp(false)} 
      />

      <div className="addNodeButtonContainer">
        <button
          className="addNodeButton help-button"
          onClick={() => setShowShortcutsHelp(true)}
          title="Keyboard Shortcuts (Press ?)"
        >
          ❓
        </button>
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
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        snapToGrid={snapToGrid}
        snapGrid={[16, 16]}
        onNodeContextMenu={handleNodeContextMenu}
        proOptions={{ hideAttribution: true }}
        onMove={() => setContextMenu({ visible: false, x: 0, y: 0, nodeId: null })}
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Shift"
        deleteKeyCode={null}
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        elevateNodesOnSelect={true}
        selectNodesOnDrag={false}
        panOnDrag={[1, 2]}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        preventScrolling={true}
        nodesDraggable={!isInteracting}
        nodesConnectable={true}
        elementsSelectable={true}
        autoPanOnNodeDrag={true}
        autoPanOnConnect={true}
      >
        <defs>
          <filter id="glow">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#66f" />
          </filter>
        </defs>
        {showGrid && <Background variant="dots" gap={20} size={1} color="#ffffff44" style={{ opacity: 0.5 }} />}
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
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showMinimap, setShowMinimap] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved', 'error', 'loading'
  const [showPerformance, setShowPerformance] = useState(false);

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
      {/* Save Status Indicator */}
      <div className={`save-status-indicator ${saveStatus}`}>
        {saveStatus === 'saving' && '💾 Saving...'}
        {saveStatus === 'saved' && '✓ Saved'}
        {saveStatus === 'unsaved' && '● Unsaved changes'}
        {saveStatus === 'error' && '⚠ Save failed'}
        {saveStatus === 'loading' && '⟳ Loading...'}
      </div>

      {/* Performance Monitor (dev tool) */}
      <PerformanceMonitor enabled={showPerformance} />

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
          saveStatus={saveStatus}
          setSaveStatus={setSaveStatus}
          showPerformance={showPerformance}
          setShowPerformance={setShowPerformance}
        />
      </ReactFlowProvider>
    </div>
  );
}