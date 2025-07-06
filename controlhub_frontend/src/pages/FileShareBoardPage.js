import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FileShareBoardPage.css';

const API_URL = 'https://controlhub-backend.onrender.com/api/fileshare';

function FileShareBoardPage() {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_URL);
        setBoard(res.data);
      } catch (err) {
        setError('Failed to load file share board.');
      } finally {
        setLoading(false);
      }
    };
    fetchBoard();
  }, []);

  return (
    <div className="fileshare-board-container">
      <h2>File Share Board</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {board && (
        <div className="board-content">
          <pre>{JSON.stringify(board, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default FileShareBoardPage;
