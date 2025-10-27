import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import './BookmarksPage.css';
import BookmarkAnimation from '../components/animations/BookmarkAnimation';

const API_URL = `${API_BASE_URL}/bookmarks`;
const initialBookmarkState = { title: '', link: '', category: '' };

function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
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

  const uniqueCategories = [...new Set(bookmarks.map(bm => bm.category).filter(Boolean))];

  const filtered = bookmarks.filter(
    (bm) =>
      bm &&
      bm.title &&
      bm.category &&
      (filterCategory === '' || bm.category === filterCategory)
  );

  return (
    <div className="bookmark-page">
      <BookmarkAnimation />

      <h1 className="bookmark-title">Bookmarks</h1>

      <div className="bookmark-filter">
        <select
          className="input-field bookmark-dropdown"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="bookmark-input">
        <input
          type="text"
          placeholder="Title"
          className="input-field"
          value={newBookmark.title}
          onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="Category"
          className="input-field"
          value={newBookmark.category}
          onChange={(e) => setNewBookmark({ ...newBookmark, category: e.target.value })}
        />
        <input
          type="text"
          placeholder="Link"
          className="input-field"
          value={newBookmark.link}
          onChange={(e) => setNewBookmark({ ...newBookmark, link: e.target.value })}
        />

        <div className="bookmark-buttons">
          <button className="button neon-add" onClick={handleAddOrUpdate} disabled={isLoading}>
            {editingId ? 'Update' : 'Add'}
          </button>
          {editingId && (
            <button className="button neon-delete" onClick={handleClear}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bookmark-list">
        {filtered.length === 0 ? (
          <p className="empty-message">No bookmarks found.</p>
        ) : (
          filtered.map((bm) => (
            <a
              key={bm._id}
              href={bm.link.startsWith('http') ? bm.link : `https://${bm.link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bookmark-item"
            >
              <div className="bookmark-header">
                <div className="bookmark-content">
                  <div className="bookmark-title-text">{bm.title}</div>
                  {bm.category && <span className="bookmark-tag">#{bm.category}</span>}
                  <div className="bookmark-link">{bm.link}</div>
                </div>
                <div className="bookmark-actions" onClick={(e) => e.preventDefault()}>
                  <button onClick={() => handleEdit(bm)}>✎</button>
                  <button onClick={() => handleDelete(bm._id)}>✕</button>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}

export default BookmarksPage;
