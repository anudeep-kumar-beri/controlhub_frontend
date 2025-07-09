import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './WeeklyLogsPage.css';
import WeeklyLogsAnimation from '../components/animations/WeeklyLogsAnimation';

const API_URL = 'https://controlhub-backend.onrender.com/api/weeklylogs';

function WeeklyLogsPage() {
  const [logs, setLogs] = useState([]);
  const [weekRange, setWeekRange] = useState('');
  const [objectives, setObjectives] = useState(['']);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(API_URL);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const handleObjectiveChange = (value, index) => {
    const updated = [...objectives];
    updated[index] = value;
    setObjectives(updated);
  };

  const addObjectiveField = () => {
    setObjectives([...objectives, '']);
  };

  const removeObjectiveField = (index) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const clearForm = () => {
    setWeekRange('');
    setObjectives(['']);
    setEditingId(null);
  };

  const addOrUpdateLog = async () => {
    const cleanedObjectives = objectives.map(obj => obj.trim()).filter(Boolean);
    if (!weekRange.trim() || cleanedObjectives.length === 0) return;

    const payload = {
      weekRange: weekRange.trim(),
      objectives: cleanedObjectives,
    };

    try {
      if (editingId) {
        const res = await axios.put(`${API_URL}/${editingId}`, payload);
        setLogs(logs.map(log => (log._id === editingId ? res.data : log)));
      } else {
        const res = await axios.post(API_URL, payload);
        setLogs([res.data, ...logs]);
      }
      clearForm();
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const removeLog = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setLogs(logs.filter(log => log._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const editLog = (log) => {
    setWeekRange(log.weekRange);
    setObjectives([...log.objectives]);
    setEditingId(log._id);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor('#ffffff');
    doc.text('Weekly Objectives Summary', 14, 20);
    let y = 30;
    logs.forEach((log) => {
      doc.setFontSize(14);
      doc.setTextColor('#ffffff');
      doc.text(`Week: ${log.weekRange}`, 14, y);
      const rows = log.objectives.map(obj => [`• ${obj.trim()}`]);
      doc.autoTable({
        startY: y + 5,
        head: [['Objectives']],
        body: rows,
        styles: {
          textColor: [255, 255, 255],
          fillColor: '#0e0e0e',
          fontSize: 11,
        },
        headStyles: {
          fillColor: '#333333',
          textColor: '#ffffff',
        },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 10;
    });
    doc.save('weekly_objectives.pdf');
  };

  return (
    <div className="weekly-page">
      <WeeklyLogsAnimation />
      <h1 className="weekly-title">Weekly Objectives</h1>

      <div className="weekly-form">
        <input
          className="weekly-input"
          type="text"
          placeholder="Week Range (e.g. Jul 1 – Jul 7, 2025)"
          value={weekRange}
          onChange={(e) => setWeekRange(e.target.value)}
        />

        {objectives.map((obj, idx) => (
          <div key={idx} className="objective-row">
            <input
              className="weekly-input"
              type="text"
              placeholder={`Objective #${idx + 1}`}
              value={obj}
              onChange={(e) => handleObjectiveChange(e.target.value, idx)}
            />
            {objectives.length > 1 && (
              <button onClick={() => removeObjectiveField(idx)} className="weekly-button">✕</button>
            )}
          </div>
        ))}

        <div className="button-group">
          <button className="weekly-button" onClick={addObjectiveField}>＋ Add Field</button>
          <button className="weekly-button" onClick={addOrUpdateLog}>
            {editingId ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      <div className="weekly-list">
        {logs.length === 0 ? (
          <p className="weekly-empty">No objectives added yet. Plan your week!</p>
        ) : (
          <>
            {logs.map((log) => (
              <div key={log._id} className="weekly-card">
                <div className="weekly-header">
                  <h3>{log.weekRange}</h3>
                  <div className="weekly-actions">
                    <button className="weekly-button" onClick={() => editLog(log)}>✎</button>
                    <button className="weekly-button" onClick={() => removeLog(log._id)}>✕</button>
                  </div>
                </div>
                <ul>
                  {log.objectives.map((obj, i) => (
                    <li key={i}>• {obj}</li>
                  ))}
                </ul>
              </div>
            ))}
            <div style={{ textAlign: 'center' }}>
              <button className="export-button" onClick={exportToPDF}>⬇ Export as PDF</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default WeeklyLogsPage;
