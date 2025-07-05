import React from 'react';
import './NotFoundPage.css';

function NotFoundPage() {
  return (
    <div className="notfound-page">
      <h1>404</h1>
      <p>Oops! This page doesn't exist.</p>
      <a href="/" className="back-home">← Back to Dashboard</a>
    </div>
  );
}

export default NotFoundPage;
