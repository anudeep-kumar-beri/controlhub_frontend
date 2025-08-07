import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary.js';
import DashboardHome from './pages/DashboardHome.js';
import SkillTrackerPage from './pages/SkillTracker/SkillTrackerPage';
import SkillDetailPage from './pages/SkillTracker/SkillDetailPage';
import WeeklyLogsPage from './pages/WeeklyLogsPage.js';
import JobTrackerPage from './pages/JobTrackerPage.js';
import BookmarksPage from './pages/BookmarksPage.js';
import QuickJournalPage from './pages/QuickJournalPage.js';
import NotFoundPage from './pages/NotFoundPage.js';
import ProjectsPage from './pages/ProjectsPage.js';
import ProjectDetailPage from './pages/ProjectDetailPage.js';
import FlowWorkspacePage from './pages/FlowWorkspacePage.jsx';
import './App.css'; // Import global styles

function App() {
 
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/skill-tracker" element={<SkillTrackerPage />} />
        <Route path="/skills/:id" element={<SkillDetailPage />} />
        <Route path="/weekly-logs" element={<WeeklyLogsPage />} />
          <Route path="/job-tracker" element={<JobTrackerPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/quick-journal" element={<QuickJournalPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/flow-workspace" element={<FlowWorkspacePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
  );
}

export default App;
