import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import AuthSuccess from './pages/AuthSuccess';
import Dashboard from './pages/Dashboard';
import Neighborhoods from './pages/Neighborhoods';
import NeighborhoodDetail from './pages/NeighborhoodDetail';
import MyNeighborhoods from './pages/MyNeighborhoods';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/neighborhoods" element={<Neighborhoods />} />
          <Route path="/neighborhoods/:id" element={<NeighborhoodDetail />} />
          <Route path="/my-neighborhoods" element={<MyNeighborhoods />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
