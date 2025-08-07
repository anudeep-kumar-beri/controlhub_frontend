import React, { useState } from 'react';
import './NodeLibrary.css';

const nodeLibrary = {
  "Personal": [
    { label: "Daily Habit", nodeType: "habit", description: "Track a daily routine" },
    { label: "Note", nodeType: "note", description: "Write a personal note" },
    { label: "Idea", nodeType: "idea", description: "Capture a spontaneous thought" },
    { label: "Reminder", nodeType: "reminder", description: "Don't forget something" }
  ],
  "Professional": [
    { label: "Task", nodeType: "task", description: "Work-related task" },
    { label: "Meeting", nodeType: "meeting", description: "Schedule or summary" },
    { label: "Project", nodeType: "project", description: "Manage a work project" },
    { label: "Decision", nodeType: "decision", description: "Key choice made" }
  ],
  "Life Events": [
    { label: "Milestone", nodeType: "milestone", description: "Major event" },
    { label: "Incident", nodeType: "incident", description: "Life incident" },
    { label: "Event", nodeType: "event", description: "Occasion or gathering" },
    { label: "Goal", nodeType: "goal", description: "Personal or career goal" }
  ]
};

export default function NodeLibrary() {
  const [expandedCategory, setExpandedCategory] = useState(null);

  const toggleCategory = (cat) => {
    setExpandedCategory((prev) => (prev === cat ? null : cat));
  };

  const handleDragStart = (event, nodeData) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="node-library">
      <h4>Node Library</h4>
      {Object.entries(nodeLibrary).map(([category, nodes]) => (
        <div className="library-section" key={category}>
          <div className="library-category" onClick={() => toggleCategory(category)}>
            {category}
            <span>{expandedCategory === category ? '▲' : '▼'}</span>
          </div>
          {expandedCategory === category && (
            <div className="category-nodes">
              {nodes.map((node, index) => (
                <div
                  key={index}
                  className="node-preview-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, node)}
                >
                  <strong>{node.label}</strong>
                  <p>{node.description}</p>
                  <span className="node-tag">{node.nodeType}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
