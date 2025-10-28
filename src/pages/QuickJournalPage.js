import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import './QuickJournalPage.css';
import JournalAnimation from '../components/animations/JournalAnimation';

const API_URL = 'https://controlhub-backend.onrender.com/api/journal';

function QuickJournalPage() {
  const [journal, setJournal] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [pending, setPending] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    fetchJournal();
    return () => clearTimeout(debounceTimer.current);
  }, []);

  const fetchJournal = async () => {
    try {
      const res = await axios.get(API_URL);
      if (res && res.data) {
        setJournal(res.data.text || '');
        setLastUpdated(new Date(res.data.updatedAt).toLocaleString());
      }
    } catch (err) {
      console.error('Failed to load journal:', err);
    }
  };

  const autoSave = () => {
    if (!pending) return;
    axios.post(API_URL, { text: journal }).then((res) => {
      setLastUpdated(new Date(res.data.updatedAt).toLocaleString());
      setPending(false);
    }).catch(err => console.error('Autosave failed:', err));
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setJournal(value);
    setPending(true);

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(autoSave, 2000);
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
    doc.text('Quick Journal Entry', 14, 20);

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
      {/* Background animation layer (non-interactive) */}
      <JournalAnimation />

      {/* Foreground content */}
      <div className="journal-content">
        <h1 className="journal-title">Quick Journal</h1>
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
            <button className="neon-delete" onClick={clearJournal}>Clear</button>
            <button className="neon-export" onClick={exportToPDF}>Export PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickJournalPage;
