import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './WeeklyLogsPage.css';

const API_URL = 'https://controlhub-backend.onrender.com/api/weeklylogs';

function WeeklyLogsPage() {
  const [logs, setLogs] = useState([]);
  const [newLog, setNewLog] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_URL);
        setLogs(res.data);
      } catch (err) {
        setError('Failed to load weekly logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const handleAdd = async () => {
    if (!newLog.trim()) return;
    try {
      setLoading(true);
      const res = await axios.post(API_URL, { text: newLog });
      setLogs([res.data, ...logs]);
      setNewLog('');
      setError('');
    } catch (err) {
      setError('Failed to add log.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/${id}`);
      setLogs(logs.filter(l => l._id !== id));
      setError('');
    } catch (err) {
      setError('Failed to delete log.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="weekly-logs-container">
      <h2>Weekly Logs</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      <div className="add-log-form">
        <input
          type="text"
          placeholder="New log entry"
          value={newLog}
          onChange={e => setNewLog(e.target.value)}
          disabled={loading}
        />
        <button onClick={handleAdd} disabled={loading}>Add</button>
      </div>
      <ul className="logs-list">
        {logs.map(l => (
          <li key={l._id} className="log-item">
            <span>{l.text}</span>
            <button onClick={() => handleDelete(l._id)} disabled={loading}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default WeeklyLogsPage;
