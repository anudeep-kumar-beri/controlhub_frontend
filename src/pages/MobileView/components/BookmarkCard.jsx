// src/pages/MobileView/components/BookmarkCard.jsx
import React, { useState } from 'react';
import './BookmarkCard.css';
import BookmarkDetail from '../modals/BookmarkDetail';

function getFavicon(url) {
  try {
    const domain = new URL(url).origin;
    return `${domain}/favicon.ico`;
  } catch {
    return '';
  }
}

export default function BookmarkCard({ bookmarks }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState(null);

  const toggleExpanded = () => setExpanded(!expanded);
  const openDetail = (e, link) => {
    e.stopPropagation();
    setSelectedBookmark(link);
  };
  const closeDetail = () => setSelectedBookmark(null);

  return (
    <>
      <div className={`bookmark-card-wrapper ${expanded ? 'expanded' : ''}`} onClick={toggleExpanded}>
        <div className="bookmark-card-header">
          <h2>Bookmarks</h2>
          <span>{expanded ? '▲' : '▼'}</span>
        </div>

        {expanded && (
          <div className="bookmark-list">
            {bookmarks.map((link) => (
              <div className="bookmark-item" key={link._id}>
                <img src={getFavicon(link.url)} alt="favicon" className="favicon" />
                <div className="bookmark-info">
                  <a href={link.url} target="_blank" rel="noreferrer">{link.title || link.url}</a>
                  <small>
  {(() => {
    try {
      return new URL(link.url).hostname;
    } catch {
      return 'Invalid URL';
    }
  })()}
</small>

                </div>
                <button className="edit-btn" onClick={(e) => openDetail(e, link)}>Edit</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedBookmark && (
        <BookmarkDetail bookmark={selectedBookmark} onClose={closeDetail} />
      )}
    </>
  );
}
