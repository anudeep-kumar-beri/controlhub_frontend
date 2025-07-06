import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import './QuickJournalPage.css';

const API_URL = 'https://controlhub-api.onrender.com/api/journal';

function QuickJournalPage() {
  const [journal, setJournal] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetchJournal();
  }, []);

  const fetchJournal = async () => {
    try {
      const res = await axios.get(API_URL);
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
      const res = await axios.post(API_URL, { text: journal });
      setLastUpdated(new Date(res.data.updatedAt).toLocaleString());
      setPending(false);
    } catch (err) {
      console.error('Failed to save journal:', err);
    }
  };

  const clearJournal = async () => {
    try {
      await axios.delete(API_URL);
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
    doc.setTextColor('#000000');
    const textLines = doc.splitTextToSize(journal || '(No journal entry)', 180);
    doc.text(textLines, 14, 40);

    if (lastUpdated) {
      doc.setTextColor('#666666');
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
        <div className="button-group">
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
