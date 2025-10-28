import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary.js';
import LockScreen from './components/common/LockScreen.jsx';
import DashboardHome from './pages/DashboardHome.js';
import SkillTrackerPage from './pages/SkillTracker/SkillTrackerPage.js';
import SkillDetailPage from './pages/SkillTracker/SkillDetailPage.js';
import WeeklyLogsPage from './pages/WeeklyLogsPage.js';
import JobTrackerPage from './pages/JobTrackerPage.js';
import BookmarksPage from './pages/BookmarksPage.js';
import QuickJournalPage from './pages/QuickJournalPage.js';
import NotFoundPage from './pages/NotFoundPage.js';
import ProjectsPage from './pages/ProjectsPage.js';
import ProjectDetailPage from './pages/ProjectDetailPage.js';
import FlowWorkspacePage from './pages/FlowWorkspacePage.jsx';
import FinanceDashboard from './pages/FinanceFlow/FinanceDashboard.jsx';
import Investments from './pages/FinanceFlow/Investments.jsx';
import Income from './pages/FinanceFlow/Income.jsx';
import Expenses from './pages/FinanceFlow/Expenses.jsx';
import Loans from './pages/FinanceFlow/Loans.jsx';
import MasterSheetPage from './pages/FinanceFlow/MasterSheetPage.jsx';
import Audit from './pages/FinanceFlow/Audit.jsx';
import Settings from './pages/FinanceFlow/Settings.jsx';

function App() {
  const location = useLocation();
  const [showLock, setShowLock] = useState(false);

  useEffect(() => {
    const onHome = location.pathname === '/';
    const unlocked = sessionStorage.getItem('ch_unlocked') === '1';
    // show lock screen only on home, once per session
    setShowLock(onHome && !unlocked);
  }, [location.pathname]);

  function handleUnlock() {
    sessionStorage.setItem('ch_unlocked', '1');
    setShowLock(false);
  }

  return (
    <ErrorBoundary>
      {showLock && <LockScreen onUnlock={handleUnlock} />}
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
          {/** FinanceFlow routes */}
          <Route path="/finance" element={<FinanceDashboard />} />
          <Route path="/finance/investments" element={<Investments />} />
          <Route path="/finance/income" element={<Income />} />
          <Route path="/finance/expenses" element={<Expenses />} />
          <Route path="/finance/loans" element={<Loans />} />
          <Route path="/finance/master-sheet" element={<MasterSheetPage />} />
          <Route path="/finance/audit" element={<Audit />} />
          <Route path="/finance/settings" element={<Settings />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
  );
}

export default App;
