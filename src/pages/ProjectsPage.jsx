import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ControlHubBackground from '../components/backgrounds/ControlHubBackground';
import FileShareAnimation from '../components/animations/FileShareAnimation';
import './ProjectsPage.css';

const API_URL = 'https://controlhub-backend.onrender.com/api/projects';

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(API_URL);
      setProjects(res.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await axios.post(API_URL, {
        name: newProjectName,
        description: newProjectDesc
      });
      setProjects([res.data, ...projects]);
      setNewProjectName('');
      setNewProjectDesc('');
    } catch (err) {
      console.error('Error adding project:', err);
    }
  };

  return (
    <div className="projects-page">
      <ControlHubBackground />
      <FileShareAnimation />

      <h1 className="projects-title">📁 Projects Dashboard</h1>

      <div className="add-project-form glassy">
        <input
          type="text"
          placeholder="Project Name"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Short Description"
          value={newProjectDesc}
          onChange={(e) => setNewProjectDesc(e.target.value)}
        />
        <button onClick={handleAddProject}>＋ Add Project</button>
      </div>

      <div className="project-cards">
        {projects.map((project) => (
          <div
            key={project._id}
            className="project-card glassy"
            onClick={() => navigate(`/projects/${project._id}`)}
          >
            <h2>{project.name}</h2>
            <p>{project.description || 'No description yet.'}</p>
            <small>Version: {project.version || 'N/A'}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectsPage;
