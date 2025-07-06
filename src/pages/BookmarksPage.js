import React, { useState, useEffect } from 'react';
import api from '../api.js';
import './BookmarksPage.css';

function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [search, setSearch] = useState('');
  const [newBookmark, setNewBookmark] = useState({ title: '', link: '', category: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const res = await api.get('/bookmarks');
      setBookmarks(res.data);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    }
  };

  const handleAddOrUpdate = async () => {
    if (!newBookmark.title || !newBookmark.link) return;

    try {
      if (editingId) {
        const res = await api.put(`/bookmarks/${editingId}`, newBookmark);
        setBookmarks(bookmarks.map(b => (b._id === editingId ? res.data : b)));
      } else {
        const res = await api.post('/bookmarks', newBookmark);
        setBookmarks([res.data, ...bookmarks]);
      }
      setNewBookmark({ title: '', link: '', category: '' });
      setEditingId(null);
    } catch (err) {
      console.error('Failed to save bookmark:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/bookmarks/${id}`);
      setBookmarks(bookmarks.filter(b => b._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleEdit = (bm) => {
    setNewBookmark({ title: bm.title, link: bm.link, category: bm.category });
    setEditingId(bm._id);
  };

  const handleClear = () => {
    setNewBookmark({ title: '', link: '', category: '' });
    setEditingId(null);
  };

  const filtered = bookmarks.filter(
    (bm) =>
      bm.title.toLowerCase().includes(search.toLowerCase()) ||
      bm.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bookmark-page">
      <div className="aurora-layer" />
      <h1 className="bookmark-title">🔖 Bookmarks</h1>

      <input
        type="text"
        placeholder="🔍 Search by title or category"
        className="bookmark-search input-dark"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="bookmark-input">
        <input
          type="text"
          placeholder="📌 Title"
          className="input-dark"
          value={newBookmark.title}
          onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="🔗 URL"
          className="input-dark"
          value={newBookmark.link}
          onChange={(e) => setNewBookmark({ ...newBookmark, link: e.target.value })}
        />
        <input
          type="text"
          placeholder="🏷️ Category (Docs, Tools...)"
          className="input-dark"
          value={newBookmark.category}
          onChange={(e) => setNewBookmark({ ...newBookmark, category: e.target.value })}
        />
        <button className="neon-add" onClick={handleAddOrUpdate}>
          {editingId ? '✎ Update' : '＋ Add'}
        </button>
        {editingId && (
          <button className="neon-delete" onClick={handleClear}>Cancel</button>
        )}
      </div>

      <div className="bookmark-list">
        {filtered.length === 0 ? (
          <p className="empty-message">No bookmarks found.</p>
        ) : (
          filtered.map((bm) => (
            <div key={bm._id} className="bookmark-item glow-hover">
              <div className="bookmark-header">
                <div>
                  <a href={bm.link} target="_blank" rel="noreferrer">{bm.title}</a>
                  {bm.category && <span className="bookmark-tag">#{bm.category}</span>}
                </div>
                <div>
                  <button className="bookmark-edit" onClick={() => handleEdit(bm)}>✎</button>
                  <button className="bookmark-delete" onClick={() => handleDelete(bm._id)}>✕</button>
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
