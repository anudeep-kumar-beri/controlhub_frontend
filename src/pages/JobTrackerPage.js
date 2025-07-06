import React, { useState, useEffect } from 'react';
import api from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.js';
import './JobTrackerPage.css';

function JobTrackerPage() {
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState({ role: '', status: '' });
  const [sortBy, setSortBy] = useState('date-desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    console.log('JobTrackerPage mounted, fetching jobs...');
    console.log('API base URL:', api.defaults.baseURL);
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching jobs from API...');
      
      const res = await api.get('/jobs');
      console.log('Jobs fetched successfully:', res.data);
      
      setJobs(res.data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError('Failed to load jobs. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = async () => {
    if (!newJob.role || !newJob.status) {
      alert('Please fill in both job role and status');
      return;
    }

    const payload = {
      ...newJob,
      date: new Date().toLocaleDateString()
    };

    try {
      setAdding(true);
      console.log('Adding job:', payload);
      
      const res = await api.post('/jobs', payload);
      console.log('Job added successfully:', res.data);
      
      setJobs([res.data, ...jobs]);
      setNewJob({ role: '', status: '' });
    } catch (err) {
      console.error('Add failed:', err);
      alert('Failed to add job. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/jobs/${id}`);
      setJobs(jobs.filter(job => job._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const jobToUpdate = jobs.find(job => job._id === id);
    if (!jobToUpdate) return;

    try {
      const res = await api.put(`/jobs/${id}`, {
        ...jobToUpdate,
        status: newStatus
      });
      setJobs(jobs.map(job => (job._id === id ? res.data : job)));
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const clearJobs = async () => {
    const confirm = window.confirm("Are you sure you want to delete all jobs?");
    if (!confirm) return;

    try {
      const deletions = jobs.map(job => api.delete(`/jobs/${job._id}`));
      await Promise.all(deletions);
      setJobs([]);
    } catch (err) {
      console.error('Bulk delete failed:', err);
    }
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'alphabetical') return a.role.localeCompare(b.role);
    if (sortBy === 'status') return a.status.localeCompare(b.status);
    return 0;
  });

  // Show loading spinner while fetching initial data
  if (loading) {
    return (
      <div className="job-page">
        <div className="aurora-layer" />
        <h1 className="job-title">Job Tracker</h1>
        <LoadingSpinner message="Loading your job applications..." />
      </div>
    );
  }

  // Show error message if API fails
  if (error) {
    return (
      <div className="job-page">
        <div className="aurora-layer" />
        <h1 className="job-title">Job Tracker</h1>
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#ff6b6b',
          color: 'white',
          borderRadius: '8px',
          margin: '2rem'
        }}>
          <h3>⚠️ Error Loading Jobs</h3>
          <p>{error}</p>
          <button 
            onClick={fetchJobs}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#ff6b6b',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-page">
      <div className="aurora-layer" />
      <h1 className="job-title">Job Tracker</h1>

      <div className="sort-controls">
        <label htmlFor="sortSelect" className="sort-label">Sort:</label>
        <select
          id="sortSelect"
          className="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="alphabetical">A-Z Role</option>
          <option value="date-desc">Latest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="status">By Status</option>
        </select>
      </div>

      <div className="job-list">
        {jobs.length === 0 ? (
          <p className="empty-message">No jobs tracked yet.</p>
        ) : (
          sortedJobs.map((job) => (
            <div key={job._id} className="job-entry glow-hover">
              <strong>{job.role}</strong>
              <select
                className="status-input"
                value={job.status}
                onChange={(e) => handleStatusChange(job._id, e.target.value)}
              >
                <option value="Applied">Applied</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Offer Received">Offer Received</option>
                <option value="Rejected">Rejected</option>
              </select>
              <span className="meta">{job.date}</span>
              <button className="delete-btn" onClick={() => handleDelete(job._id)}>
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      <div className="job-input">
        <input
          type="text"
          placeholder="Job Role"
          value={newJob.role}
          onChange={(e) => setNewJob({ ...newJob, role: e.target.value })}
        />
        <select
          value={newJob.status}
          onChange={(e) => setNewJob({ ...newJob, status: e.target.value })}
        >
          <option value="">Select Status</option>
          <option value="Applied">Applied</option>
          <option value="Interview Scheduled">Interview Scheduled</option>
          <option value="Offer Received">Offer Received</option>
          <option value="Rejected">Rejected</option>
        </select>
        <div className="job-buttons">
          <button 
            className="add-btn" 
            onClick={handleAddJob}
            disabled={adding}
          >
            {adding ? '⏳ Adding...' : 'Add'}
          </button>
          <button className="clear-btn" onClick={clearJobs}>Clear All</button>
        </div>
      </div>
    </div>
  );
}

export default JobTrackerPage;
