import React, { useState } from 'react';
import './ImportExportPanel.css';
import generateFlowPDF from './generateFlowPDF';

export default function ImportExportPanel({ wrapperRef, flowData, currentWorkspace }) {
  const [fileName, setFileName] = useState('FlowCanvas');
  const [paperSize, setPaperSize] = useState('a4');
  const [orientation, setOrientation] = useState('landscape');
  const [expanded, setExpanded] = useState(false);

  const downloadJSON = () => {
    if (!flowData?.nodes || !flowData?.edges) {
      alert("Flow data missing!");
      return;
    }

    try {
      const dataStr = JSON.stringify(
        {
          workspace: currentWorkspace,
          nodes: flowData.nodes,
          edges: flowData.edges,
          exportedAt: new Date().toISOString(),
        },
        null,
        2
      );
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName || 'FlowCanvas'}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("JSON Export Error:", err);
      alert("Failed to export JSON.");
    }
  };

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

  const importJSON = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.nodes && data.edges) {
          // Trigger import callback (would need to be passed as prop)
          console.log('Imported data:', data);
          alert('Import successful! (Feature needs parent callback implementation)');
        } else {
          alert('Invalid JSON format');
        }
      } catch (err) {
        console.error("JSON Import Error:", err);
        alert("Failed to import JSON.");
      }
    };
    reader.readAsText(file);
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

        <div className="export-buttons">
          <button onClick={downloadJSON} className="export-btn json-btn">
            📄 Export JSON
          </button>
          <button onClick={downloadPDF} className="export-btn pdf-btn">
            📕 Export PDF
          </button>
        </div>

        <div className="import-section">
          <label className="import-label">
            📥 Import JSON
            <input
              type="file"
              accept=".json"
              onChange={importJSON}
              className="file-input"
            />
          </label>
        </div>
      </div>
    </div>
  );
}