import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './QuickJournalPage.css';

const API_URL = 'https://controlhub-backend.onrender.com/api/journal';

function QuickJournalPage() {
  const [journal, setJournal] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJournal = async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_URL);
        if (res.data && res.data.length > 0) {
          setJournal(res.data[0].text || '');
          setLastUpdated(new Date(res.data[0].updatedAt).toLocaleString());
        }
      } catch (err) {
        setError('Failed to load journal.');
      } finally {
        setLoading(false);
      }
    };
    fetchJournal();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      await axios.post(API_URL, { text: journal });
      setLastUpdated(new Date().toLocaleString());
      setError('');
    } catch (err) {
      setError('Failed to save journal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quick-journal-container">
      <h2>Quick Journal</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      <textarea
        value={journal}
        onChange={e => setJournal(e.target.value)}
        placeholder="Write your thoughts here..."
        rows={10}
        className="journal-textarea"
      />
      <div className="journal-actions">
        <button onClick={handleSave} disabled={loading}>Save</button>
        {lastUpdated && <span className="last-updated">Last updated: {lastUpdated}</span>}
      </div>
    </div>
  );
}

export default QuickJournalPage;
