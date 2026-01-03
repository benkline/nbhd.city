import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import AuthSuccess from './pages/AuthSuccess';
import Dashboard from './pages/Dashboard';
import Nbhds from './pages/Neighborhoods';
import NbhdDetail from './pages/NeighborhoodDetail';
import MyNbhds from './pages/MyNeighborhoods';
import UserProfile from './pages/UserProfile';
import './App.css';

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
          <Route path="/my-nbhds" element={<MyNbhds />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
