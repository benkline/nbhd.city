import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import AuthSuccess from './pages/AuthSuccess';
import Dashboard from './pages/Dashboard';
import Nbhds from './pages/Neighborhoods';
import NbhdDetail from './pages/NeighborhoodDetail';
import AdminPage from './pages/AdminPage';
import CMSView from './pages/CMSView';
import WelcomePage from './pages/WelcomePage';
import MyNbhds from './pages/MyNeighborhoods';
import PersonalSites from './pages/PersonalSites';
import SiteEditor from './pages/SiteEditor';
import SiteContentManager from './pages/SiteContentManager';
import UserProfile from './pages/UserProfile';
import ProjectSites from './pages/ProjectSites';
import Templates from './pages/Templates';
import './App.css';
import './styles/HarmonyAnimations.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/nbhds" element={<Nbhds />} />
          <Route path="/nbhds/:id" element={<NbhdDetail />} />
          <Route path="/nbhds/:id/admin" element={<AdminPage />} />
          <Route path="/nbhds/:id/cms" element={<CMSView />} />
          <Route path="/nbhds/:id/welcome" element={<WelcomePage />} />
          <Route path="/my-nbhds" element={<MyNbhds />} />
          <Route path="/personal-sites" element={<PersonalSites />} />
          <Route path="/sites/:siteId/cms" element={<SiteContentManager />} />
          <Route path="/site-editor" element={<SiteEditor />} />
          <Route path="/site-editor/:templateId" element={<SiteEditor />} />
          <Route path="/project-sites" element={<ProjectSites />} />
          <Route path="/templates/*" element={<Templates />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
