import React, { useState } from 'react';
import './ImportExportPanel.css';
import generateFlowPDF from './generateFlowPDF';

export default function ImportExportPanel({ wrapperRef, flowData, currentWorkspace }) {
  const [fileName, setFileName] = useState('FlowCanvas');
  const [paperSize, setPaperSize] = useState('a4');
  const [orientation, setOrientation] = useState('landscape');
  const [expanded, setExpanded] = useState(false); // 🆕

  const downloadPDF = () => {
    if (!flowData?.nodes || !flowData?.edges) {
      alert("Flow data missing!");
      return;
    }

    try {
      generateFlowPDF({
        nodes: flowData.nodes,
        edges: flowData.edges,
        workspace: currentWorkspace,
        fileName,
        paperSize,
        orientation,
      });
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Failed to generate PDF.");
    }
  };

  return (
    <div className="import-export-panel glass-card">
      {/* Toggle Header */}
      <div className="panel-toggle-header" onClick={() => setExpanded(!expanded)}>
        <span>Export Options</span>
        <span className={`arrow ${expanded ? 'open' : ''}`}>▾</span>
      </div>

      {/* Slide section */}
      <div className={`panel-body ${expanded ? 'open' : ''}`}>
        <label>Filename:</label>
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="FlowCanvas"
        />

        <label>Paper Size:</label>
        <select value={paperSize} onChange={(e) => setPaperSize(e.target.value)}>
          <option value="a4">A4</option>
          <option value="a3">A3</option>
          <option value="letter">Letter</option>
        </select>

        <label>Orientation:</label>
        <select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
          <option value="landscape">Landscape</option>
          <option value="portrait">Portrait</option>
        </select>

        <button onClick={downloadPDF}>Download PDF</button>
      </div>
    </div>
  );
}