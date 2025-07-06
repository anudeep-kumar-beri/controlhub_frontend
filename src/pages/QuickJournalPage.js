import React, { useState, useEffect } from 'react';
import api from '../api.js';
import jsPDF from 'jspdf';
import './QuickJournalPage.css';

function QuickJournalPage() {
  const [journal, setJournal] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetchJournal();
  }, []);

  const fetchJournal = async () => {
    try {
      const res = await api.get('/journal');
      if (res.data) {
        setJournal(res.data.text || '');
        setLastUpdated(new Date(res.data.updatedAt).toLocaleString());
      }
    } catch (err) {
      console.error('Failed to load journal:', err);
    }
  };

  const handleChange = (e) => {
    setJournal(e.target.value);
    setPending(true);
  };

  const handleUpdate = async () => {
    try {
      const res = await api.post('/journal', { text: journal });
      setLastUpdated(new Date(res.data.updatedAt).toLocaleString());
      setPending(false);
    } catch (err) {
      console.error('Failed to save journal:', err);
    }
  };

  const clearJournal = async () => {
    try {
      await api.delete('/journal');
      setJournal('');
      setLastUpdated('');
      setPending(false);
    } catch (err) {
      console.error('Failed to clear journal:', err);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor('#cc66ff');
    doc.text('📝 Quick Journal Entry', 14, 20);

    doc.setFontSize(12);
    doc.setTextColor('#ffffff');
    const textLines = doc.splitTextToSize(journal || '(No journal entry)', 180);
    doc.text(textLines, 14, 40);

    if (lastUpdated) {
      doc.setTextColor('#aaaaaa');
      doc.setFontSize(10);
      doc.text(`Last updated: ${lastUpdated}`, 14, doc.internal.pageSize.height - 10);
    }

    doc.save('quick_journal.pdf');
  };

  return (
    <div className="journal-page">
      <div className="aurora-layer" />
      <h1 className="journal-title">📝 Quick Journal</h1>
      <textarea
        className="journal-input"
        value={journal}
        onChange={handleChange}
        placeholder="Write something reflective or important..."
        rows={10}
      />
      <div className="journal-actions">
        <span className="timestamp">
          {lastUpdated && `Last updated: ${lastUpdated}`}
        </span>
        <div>
          <button className="neon-save" onClick={handleUpdate} disabled={!pending}>
            {pending ? '💾 Update' : '✅ Up to Date'}
          </button>
          <button className="neon-delete" onClick={clearJournal}>🗑 Clear</button>
          <button className="neon-export" onClick={exportToPDF}>⬇ Export PDF</button>
        </div>
      </div>
    </div>
  );
}

export default QuickJournalPage;
