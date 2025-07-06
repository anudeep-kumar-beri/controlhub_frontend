import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import './BookmarksPage.css';

const API_URL = `${API_BASE_URL}/bookmarks`;
const initialBookmarkState = { title: '', link: '', category: '' };

function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [search, setSearch] = useState('');
  const [newBookmark, setNewBookmark] = useState(initialBookmarkState);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(API_URL);
      setBookmarks(res.data);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrUpdate = async () => {
    if (!newBookmark.title || !newBookmark.link) return;
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setNewBookmark(initialBookmarkState);
    setEditingId(null);
  };

  const handleEdit = (bookmark) => {
    setNewBookmark({
      title: bookmark.title,
      link: bookmark.link,
      category: bookmark.category,
    });
    setEditingId(bookmark._id);
  };

  const handleDelete = async (id) => {
    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}`);
      setBookmarks(bookmarks.filter((b) => b._id !== id));
    } catch (err) {
      console.error('Failed to delete bookmark:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = bookmarks.filter(
    (bm) =>
      bm &&
      bm.title &&
      bm.category &&
      (bm.title.toLowerCase().includes(search.toLowerCase()) ||
        bm.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bookmark-page">
      <div className="aurora-layer" />
      <h1 className="bookmark-title">🔖 Bookmarks</h1>
      <input
        type="text"
        aria-label="Search bookmarks"
        placeholder="🔍 Search by title or category"
        className="input-field bookmark-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="bookmark-input">
        <input
          type="text"
          placeholder="📌 Title"
          className="input-field"
          value={newBookmark.title}
          onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="🏷️ Category"
          className="input-field"
          value={newBookmark.category}
          onChange={(e) => setNewBookmark({ ...newBookmark, category: e.target.value })}
        />
        <input
          type="text"
          placeholder="🔗 Link"
          className="input-field"
          value={newBookmark.link}
          onChange={(e) => setNewBookmark({ ...newBookmark, link: e.target.value })}
          required
        />

        <div className="bookmark-buttons">
          <button
            className="button neon-add"
            onClick={handleAddOrUpdate}
            disabled={isLoading}
          >
            {editingId ? '✎ Update' : '＋ Add'}
          </button>
          {editingId && (
            <button className="button neon-delete" onClick={handleClear}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bookmark-list" role="list">
        {filtered.length === 0 ? (
          <p className="empty-message">No bookmarks found.</p>
        ) : (
          filtered.map((bm) => (
            <div key={bm._id} className="bookmark-item" role="listitem">
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
                  <button
                    className="bookmark-delete"
                    onClick={() => handleDelete(bm._id)}
                    aria-label={`Delete bookmark: ${bm.title}`}
                  >
                    ✕
                  </button>
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
