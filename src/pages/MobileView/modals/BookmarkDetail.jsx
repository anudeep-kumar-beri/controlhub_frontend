// src/pages/MobileView/modals/BookmarkDetail.jsx
import React, { useState } from 'react';
import './BookmarkDetail.css';

export default function BookmarkDetail({ bookmark, onClose }) {
  const [title, setTitle] = useState(bookmark.title || '');
  const [url, setUrl] = useState(bookmark.url || '');
  const [tag, setTag] = useState(bookmark.tag || '');

  const handleSave = () => {
    console.log('Saving bookmark:', { title, url, tag });
    onClose();
  };

  return (
    <div className="bookmark-detail-modal">
      <button className="close-btn" onClick={onClose}>✕</button>
      <h2>Edit Bookmark</h2>

      <label>Title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />

      <label>URL</label>
      <input value={url} onChange={(e) => setUrl(e.target.value)} />

      <label>Tag</label>
      <input value={tag} onChange={(e) => setTag(e.target.value)} />

      <button className="save-btn" onClick={handleSave}>Save Changes</button>
    </div>
  );
}
