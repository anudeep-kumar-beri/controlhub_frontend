import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import './BookmarksPage.css';

const API_URL = `${API_BASE_URL}/bookmarks`;
const initialBookmarkState = { title: '', link: '', category: '' };

function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [search, setSearch] = useState('');
  const [newBookmark, setNewBookmark] = useState({ title: '', link: '', category: '' });
  const [editingId, setEditingId] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    fetchBookmarks();
  }, []);
  const fetchBookmarks = async () => {
    try {
      const res = await axios.get(API_URL);
      setIsLoading(true);
      setBookmarks(res.data);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrUpdate = async () => {
    if (!newBookmark.title || !newBookmark.link) return; // Basic validation
    setIsLoading(true);
    try {
      if (editingId) {
        const res = await axios.put(`${API_URL}/${editingId}`, newBookmark);
        setBookmarks(bookmarks.map(b => (b._id === editingId ? res.data : b)));
      } else {
        const res = await axios.post(API_URL, newBookmark);
        setBookmarks([res.data, ...bookmarks]);
      }
      handleClear();
    } catch (err) {
      console.error('Failed to save bookmark:', err);
      // Consider adding user-facing error handling here, e.g., setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


  const handleClear = () => {
    setNewBookmark(initialBookmarkState);
    setEditingId(null);
  };

  const filtered = bookmarks.filter(
    (bm) =>
      bm && bm.title && bm.category && (
        bm.title.toLowerCase().includes(search.toLowerCase()) ||
        bm.category.toLowerCase().includes(search.toLowerCase())
      )
  );

  return (
    <div className="bookmark-page">
      <div className="aurora-layer" />
      <h1 className="bookmark-title">🔖 Bookmarks</h1>
      <input
        type="text"
        aria-label="Search bookmarks"
        placeholder="🔍 Search by title or category"
        className="bookmark-search input-dark"
        value={search}
      />
      <div className="bookmark-input">
        <input
          aria-label="Bookmark Title"
          type="text"
          placeholder="📌 Title"
          className="input-dark"
          value={newBookmark.title}
          onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
          required
        />
        <input
          type="text"
          value={newBookmark.category}
          onChange={(e) => setNewBookmark({ ...newBookmark, category: e.target.value })}
        />
        <button
          className="neon-add"
          onClick={handleAddOrUpdate}
          aria-label={editingId ? "Update bookmark" : "Add bookmark"}
          disabled={isLoading}
        >
          {editingId ? '✎ Update' : '＋ Add'}
        </button>
        {editingId && (
          <button className="neon-delete" onClick={handleClear} aria-label="Cancel editing">
            Cancel
          </button>
        )}
      </div>
      <div className="bookmark-list" role="list">
        {filtered.length === 0 ? (
          <p className="empty-message">No bookmarks found.</p>
        ) : (
          filtered.map((bm) => (
            <div key={bm._id} className="bookmark-item glow-hover" role="listitem">
              <div className="bookmark-header">
                <div className="bookmark-content">
                  <a href={bm.link} target="_blank" rel="noopener noreferrer">
                    {bm.title}
                  </a>
                  {bm.category && <span className="bookmark-tag">#{bm.category}</span>}
                </div>
                <div className="bookmark-actions">
                  <button
                    className="bookmark-edit"
                    onClick={() => handleEdit(bm)}
                    aria-label={`Edit bookmark: ${bm.title}`}
                  >
                    ✎
                  </button>
                  <button className="bookmark-delete" onClick={() => handleDelete(bm._id)} aria-label={`Delete bookmark: ${bm.title}`}>✕</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default BookmarksPage;
