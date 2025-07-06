import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './WeeklyLogsPage.css';
import API_BASE_URL from '../config/api';

const API_URL = `${API_BASE_URL}/weeklylogs`;

function WeeklyLogsPage() {
  const [logs, setLogs] = useState([]);
  const [weekRange, setWeekRange] = useState('');
  const [objectives, setObjectives] = useState(['']);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

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

  const addObjectiveField = () => setObjectives([...objectives, '']);

  const removeObjectiveField = (index) => {
    const updated = objectives.filter((_, i) => i !== index);
    setObjectives(updated);
  };

  const clearForm = () => {
    setWeekRange('');
    setObjectives(['']);
    setEditingId(null);
  };

  const addOrUpdateLog = async () => {
    const cleanedObjectives = objectives.filter((obj) => obj.trim() !== '');
    if (!weekRange || cleanedObjectives.length === 0) return;
    const payload = {
      weekRange,
      objectives: cleanedObjectives
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
  doc.setTextColor('#00eaff');
  doc.text('Weekly Objectives Summary', 14, 20);
  let y = 30;
  logs.forEach((log) => {
    doc.setFontSize(14);
    doc.setTextColor('#00eaff');
    doc.text(`Week: ${log.weekRange}`, 14, y);
    const rows = log.objectives.map(obj => [`• ${obj.trim()}`]);
    doc.autoTable({
      startY: y + 5,
      head: [['Objectives']],
      body: rows,
      styles: {
        textColor: [0, 234, 255],
        fillColor: '#181c23',
        fontSize: 11,
      },
      headStyles: {
        fillColor: '#00eaff',
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
      {/* <div className="aurora-layer" /> */}
      <h1 className="weekly-title">Weekly Objectives</h1>
      <div className="log-form">
        <input
          className="input-dark"
          type="text"
          placeholder="Week Range (e.g. Jul 1 – Jul 7, 2025)"
          value={weekRange}
          onChange={(e) => setWeekRange(e.target.value)}
        />
        {objectives.map((obj, idx) => (
          <div key={idx} className="objective-row">
            <input
              className="input-dark"
              type="text"
              placeholder={`Objective #${idx + 1}`}
              value={obj}
              onChange={(e) => handleObjectiveChange(e.target.value, idx)}
            />
            {objectives.length > 1 && (
              <button onClick={() => removeObjectiveField(idx)} className="neon-delete">✕</button>
            )}
          </div>
        ))}
        <div className="button-group">
          <button className="neon-add" onClick={addObjectiveField}>＋ Add Field</button>
          <button className="neon-save" onClick={addOrUpdateLog}>
            {editingId ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
      <div className="log-list">
        {logs.length === 0 ? (
          <p className="empty-message">No objectives added yet. Plan your week!</p>
        ) : (
          <>
            {logs.map((log) => (
              <div key={log._id} className="log-card glow-hover">
                <div className="log-header">
                  <h3>{log.weekRange}</h3>
                  <div className="log-actions">
                    <button className="neon-edit" onClick={() => editLog(log)}>✎</button>
                    <button className="neon-delete" onClick={() => removeLog(log._id)}>✕</button>
                  </div>
                </div>
                <ul>
                  {log.objectives.map((obj, i) => (
                    <li key={i}>🔹 {obj}</li>
                  ))}
                </ul>
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button className="neon-save" onClick={exportToPDF}>⬇ Export as PDF</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default WeeklyLogsPage;
