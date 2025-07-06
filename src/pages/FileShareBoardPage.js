import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './FileShareBoardPage.css';

const API_URL = 'https://controlhub-backend.onrender.com/api/fileshare';

function FileShareBoardPage() {
  const [board, setBoard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [newBug, setNewBug] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [newFeatureLink, setNewFeatureLink] = useState('');
  const [newVersion, setNewVersion] = useState('');
  const [newSummary, setNewSummary] = useState('');

  useEffect(() => {
    fetchBoard();
  }, []);

  const fetchBoard = async () => {
    try {
      const res = await axios.get(API_URL);
      setBoard(res.data[0]);
    } catch (err) {
      console.error('Error fetching board:', err);
    }
  };

  const updateBoard = async (updated) => {
    if (!board || !board._id) return;
    setIsLoading(true);
    try {
      const res = await axios.put(`${API_URL}/${board._id}`, updated);
      setBoard(res.data);
    } catch (err) {
      console.error('Error updating board:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBug = () => {
    if (!newBug.trim()) return;
    const updated = {
      ...board,
      bugs: [...(board.bugs || []), { text: newBug, status: 'Pending' }],
    };
    updateBoard(updated);
    setNewBug('');
  };

  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    const updated = {
      ...board,
      features: [
        ...(board.features || []),
        { text: newFeature, status: 'Planned', link: newFeatureLink },
      ],
    };
    updateBoard(updated);
    setNewFeature('');
    setNewFeatureLink('');
  };

  const handleAddChangelog = () => {
    if (!newVersion.trim() || !newSummary.trim()) return;
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newLog = {
      version: newVersion,
      summary: newSummary,
      date,
      time,
    };

    const updated = {
      ...board,
      version: newVersion,
      changelog: [newLog, ...(board.changelog || [])],
    };
    updateBoard(updated);
    setNewVersion('');
    setNewSummary('');
  };

  const handleBugStatusChange = (index, status) => {
    const updatedBugs = [...board.bugs];
    updatedBugs[index].status = status;
    updateBoard({ ...board, bugs: updatedBugs });
  };

  const handleFeatureStatusChange = (index, status) => {
    const updatedFeatures = [...board.features];
    updatedFeatures[index].status = status;
    updateBoard({ ...board, features: updatedFeatures });
  };

  const handleRemoveBug = (index) => {
    const updatedBugs = board.bugs.filter((_, i) => i !== index);
    updateBoard({ ...board, bugs: updatedBugs });
  };

  const handleRemoveFeature = (index) => {
    const updatedFeatures = board.features.filter((_, i) => i !== index);
    updateBoard({ ...board, features: updatedFeatures });
  };

if (!board) {
  return (
    <div className="fileshare-page">
      <div className="aurora-layer" />
      <div className="loading-wrapper">
        <div className="iphone-spinner" aria-label="Loading" />
      </div>
    </div>
  );
}


  return (
    <div className="fileshare-page">
      <div className="aurora-layer" />
      <h1 className="fileshare-title">📦 FileShare Project Board</h1>

      <div className="project-info glow-hover">
        <p><strong>Current Version:</strong> {board.version}</p>

        <div className="input-group">
          <input
            type="text"
            placeholder="New Version (e.g. v1.1.0)"
            value={newVersion}
            onChange={(e) => setNewVersion(e.target.value)}
          />
          <input
            type="text"
            placeholder="Version Summary"
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
          />
          <button disabled={isLoading} onClick={handleAddChangelog}>Add Version</button>
        </div>

        <p><strong>📜 Changelog:</strong></p>
        <ul>
          {(board.changelog || []).map((log, idx) => (
            <li key={idx}>
              <strong>{log.version}</strong> ({log.date} {log.time}) — {log.summary}
            </li>
          ))}
        </ul>

        <p><strong>🐞 Bugs ({(board.bugs || []).length}):</strong></p>
        <ul>
          {(board.bugs || []).map((bug, idx) => (
            <li key={idx}>
              {bug.text} — <em>{bug.status}</em>
              <select
                value={bug.status}
                onChange={(e) => handleBugStatusChange(idx, e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Fixed">Fixed</option>
              </select>
              <button className="remove-btn" onClick={() => handleRemoveBug(idx)}>✕</button>
            </li>
          ))}
        </ul>

        <div className="input-group">
          <input
            type="text"
            placeholder="Add a new bug"
            value={newBug}
            onChange={(e) => setNewBug(e.target.value)}
          />
          <button disabled={isLoading} onClick={handleAddBug}>Add Bug</button>
        </div>

        <p><strong>🚀 Features ({(board.features || []).length}):</strong></p>
        <ul>
          {(board.features || []).map((f, idx) => (
            <li key={idx}>
              {f.link ? (
                <a href={f.link} target="_blank" rel="noreferrer">{f.text}</a>
              ) : (
                <span>{f.text}</span>
              )} — <em>{f.status}</em>
              <select
                value={f.status}
                onChange={(e) => handleFeatureStatusChange(idx, e.target.value)}
              >
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Complete">Complete</option>
              </select>
              <button className="remove-btn" onClick={() => handleRemoveFeature(idx)}>✕</button>
            </li>
          ))}
        </ul>

        <div className="input-group">
          <input
            type="text"
            placeholder="Feature Title"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
          />
          <input
            type="text"
            placeholder="Optional Link (GitHub/Docs)"
            value={newFeatureLink}
            onChange={(e) => setNewFeatureLink(e.target.value)}
          />
          <button disabled={isLoading} onClick={handleAddFeature}>Add Feature</button>
        </div>
      </div>
    </div>
  );
}

export default FileShareBoardPage;
