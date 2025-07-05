import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './FileShareBoardPage.css';

const API_URL = 'https://controlhub-backend.onrender.com/api/fileshare';

function FileShareBoardPage() {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null);     // Add error state

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
      setLoading(true); // Start loading
      setError(null);   // Clear previous errors

      const res = await axios.get(API_URL);

      // --- FIX STARTS HERE ---
      // Check if res.data is an array and has at least one element
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setBoard(res.data[0]);
      } else {
        // If no board document exists, initialize an empty structure for the frontend
        // and log a warning. You might want to automatically create one on the backend
        // or prompt the user to create it. For now, we'll just show an empty board.
        console.warn('No existing FileShare board found. Displaying an empty board.');
        setBoard({
          version: 'N/A',
          changelog: [],
          bugs: [],
          features: []
        });
      }
      // --- FIX ENDS HERE ---

    } catch (err) {
      console.error('Error fetching board:', err);
      // Set an error message to display to the user
      setError('Failed to load project board. Please try again later.');
    } finally {
      setLoading(false); // End loading, whether success or fail
    }
  };

  const updateBoard = async (updated) => {
    try {
      // Only try to PUT if a board._id exists (i.e., it's an existing board)
      if (board && board._id) {
        const res = await axios.put(`${API_URL}/${board._id}`, updated);
        setBoard(res.data);
      } else {
        // If no board_id, it means we just initialized an empty board on frontend
        // This is where you might need to make a POST request to create the *first* board.
        // For now, we'll just update the local state without backend interaction for new board.
        console.warn('Attempted to update a board with no _id. Consider adding POST logic for initial board creation.');
        setBoard(updated); // Update local state
      }
    } catch (err) {
      console.error('Error updating board:', err);
      // Handle update errors (e.g., show a toast notification)
    }
  };

  const addBug = () => {
    if (newBug.trim()) {
      const updated = {
        ...board,
        bugs: [...(board.bugs || []), { text: newBug.trim(), status: 'Pending' }]
      };
      updateBoard(updated);
      setNewBug('');
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      const updated = {
        ...board,
        features: [
          ...(board.features || []),
          { text: newFeature.trim(), status: 'Planned', link: newFeatureLink.trim() }
        ]
      };
      updateBoard(updated);
      setNewFeature('');
      setNewFeatureLink('');
    }
  };

  const updateBugStatus = (index, status) => {
    if (!board || !board.bugs) return; // Add safeguard
    const updatedBugs = [...board.bugs];
    updatedBugs[index].status = status;
    updateBoard({ ...board, bugs: updatedBugs });
  };

  const updateFeatureStatus = (index, status) => {
    if (!board || !board.features) return; // Add safeguard
    const updatedFeatures = [...board.features];
    updatedFeatures[index].status = status;
    updateBoard({ ...board, features: updatedFeatures });
  };

  const removeBug = (index) => {
    if (!board || !board.bugs) return; // Add safeguard
    const updatedBugs = board.bugs.filter((_, i) => i !== index);
    updateBoard({ ...board, bugs: updatedBugs });
  };

  const removeFeature = (index) => {
    if (!board || !board.features) return; // Add safeguard
    const updatedFeatures = board.features.filter((_, i) => i !== index);
    updateBoard({ ...board, features: updatedFeatures });
  };

  const addChangelog = () => {
    if (newVersion.trim() && newSummary.trim()) {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newLog = {
        version: newVersion.trim(),
        summary: newSummary.trim(),
        date,
        time
      };
      const updated = {
        ...board,
        version: newVersion.trim(),
        changelog: [newLog, ...(board.changelog || [])]
      };
      updateBoard(updated);
      setNewVersion('');
      setNewSummary('');
    }
  };

  // Render logic based on loading, error, or board data
  if (loading) {
    return (
      <div className="fileshare-page">
        <div className="loading-message">Loading project board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fileshare-page">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  // If board is still null or an empty object after loading, show a "create board" message
  // This helps if the API consistently returns an empty array and you want user to create the first one.
  if (!board || (Object.keys(board).length === 0 && board.constructor === Object)) {
      return (
          <div className="fileshare-page">
              <div className="project-info glow-hover">
                  <p>No project board found. Would you like to create the initial board?</p>
                  {/* You might want to add an initial "Create Board" button here
                      that sends a POST request to your API to create the first document.
                      For example:
                      <button onClick={handleCreateInitialBoard}>Create Initial Board</button>
                  */}
                  <p>Please add a version summary to start your project board.</p>
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
                    <button onClick={addChangelog}>Create Board</button>
                  </div>
              </div>
          </div>
      );
  }


  return (
    <div className="fileshare-page">
      <div className="aurora-layer"></div>
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
          <button onClick={addChangelog}>Add Version</button>
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
              <select value={bug.status} onChange={(e) => updateBugStatus(idx, e.target.value)}>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Fixed">Fixed</option>
              </select>
              <button className="remove-btn" onClick={() => removeBug(idx)}>✕</button>
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
          <button onClick={addBug}>Add Bug</button>
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
              <select value={f.status} onChange={(e) => updateFeatureStatus(idx, e.target.value)}>
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Complete">Complete</option>
              </select>
              <button className="remove-btn" onClick={() => removeFeature(idx)}>✕</button>
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
          <button onClick={addFeature}>Add Feature</button>
        </div>
      </div>
    </div>
  );
}

export default FileShareBoardPage;
