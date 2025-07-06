import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BookmarksPage.css';

const API_URL = 'https://controlhub-backend.onrender.com/api/bookmarks';

function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [newBookmark, setNewBookmark] = useState({ title: '', url: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_URL);
        setBookmarks(res.data);
      } catch (err) {
        setError('Failed to load bookmarks.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, []);

  const handleAdd = async () => {
    if (!newBookmark.title || !newBookmark.url) return;
    try {
      setLoading(true);
      const res = await axios.post(API_URL, newBookmark);
      setBookmarks([res.data, ...bookmarks]);
      setNewBookmark({ title: '', url: '' });
      setError('');
    } catch (err) {
      setError('Failed to add bookmark.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/${id}`);
      setBookmarks(bookmarks.filter(b => b._id !== id));
      setError('');
    } catch (err) {
      setError('Failed to delete bookmark.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bookmarks-container">
      <h2>Bookmarks</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      <div className="add-bookmark-form">
        <input
          type="text"
          placeholder="Title"
          value={newBookmark.title}
          onChange={e => setNewBookmark({ ...newBookmark, title: e.target.value })}
          disabled={loading}
        />
        <input
          type="url"
          placeholder="URL"
          value={newBookmark.url}
          onChange={e => setNewBookmark({ ...newBookmark, url: e.target.value })}
          disabled={loading}
        />
        <button onClick={handleAdd} disabled={loading}>Add</button>
      </div>
      <ul className="bookmarks-list">
        {bookmarks.map(b => (
          <li key={b._id} className="bookmark-item">
            <a href={b.url} target="_blank" rel="noopener noreferrer">{b.title}</a>
            <button onClick={() => handleDelete(b._id)} disabled={loading}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BookmarksPage;
