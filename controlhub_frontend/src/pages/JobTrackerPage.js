import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './JobTrackerPage.css';

const API_URL = 'https://controlhub-backend.onrender.com/api/jobs';

function JobTrackerPage() {
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState({ role: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_URL);
        setJobs(res.data);
      } catch (err) {
        setError('Failed to load jobs.');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleAdd = async () => {
    if (!newJob.role || !newJob.status) return;
    try {
      setLoading(true);
      const res = await axios.post(API_URL, newJob);
      setJobs([res.data, ...jobs]);
      setNewJob({ role: '', status: '' });
      setError('');
    } catch (err) {
      setError('Failed to add job.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/${id}`);
      setJobs(jobs.filter(j => j._id !== id));
      setError('');
    } catch (err) {
      setError('Failed to delete job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="job-tracker-container">
      <h2>Job Tracker</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      <div className="add-job-form">
        <input
          type="text"
          placeholder="Role"
          value={newJob.role}
          onChange={e => setNewJob({ ...newJob, role: e.target.value })}
        />
        <input
          type="text"
          placeholder="Status"
          value={newJob.status}
          onChange={e => setNewJob({ ...newJob, status: e.target.value })}
        />
        <button onClick={handleAdd} disabled={loading}>Add</button>
      </div>
      <ul className="jobs-list">
        {jobs.map(j => (
          <li key={j._id} className="job-item">
            <span>{j.role} - {j.status}</span>
            <button onClick={() => handleDelete(j._id)} disabled={loading}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default JobTrackerPage;
