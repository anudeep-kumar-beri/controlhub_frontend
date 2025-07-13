// src/pages/MobileView/modals/BookmarkDetail.jsx
import React, { useState } from 'react';
import './BookmarkDetail.css';
import api from '../../../api';

export default function BookmarkDetail({ bookmark, onClose }) {
  const [title, setTitle] = useState(bookmark.title || '');
  const [url, setUrl] = useState(bookmark.url || '');
  const [tag, setTag] = useState(bookmark.tag || '');

  const handleSave = async () => {
    try {
      await api.put(`/bookmarks/${bookmark._id}`, {
        title,
        url,
        tag
      });
      console.log('✅ Bookmark updated successfully');
      onClose(); // close the modal after success
    } catch (err) {
      console.error('❌ Failed to update bookmark:', err);
      alert('Something went wrong while saving. Try again.');
    }
  };

  return (
    <div className="bookmark-detail-modal">
      <button className="close-btn" onClick={onClose}>✕</button>
      <h2>Edit Bookmark</h2>

      <label>Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Bookmark title"
      />

      <label>URL</label>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
      />

      <label>Tag</label>
      <input
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        placeholder="e.g. research, tools"
      />

      <button className="save-btn" onClick={handleSave}>Save Changes</button>
    </div>
  );
}
