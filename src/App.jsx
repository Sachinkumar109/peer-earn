import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import {
  AuthProvider,
  useAuth
} from './context/AuthContext';

import Navbar from './components/Navbar';
import DemoSwitcher from './components/DemoSwitcher';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RaiseDoubt from './pages/RaiseDoubt';
import DoubtChat from './pages/DoubtChat';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';

// ============================================================
// PROTECTED ROUTE
// ============================================================

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// ============================================================
// APP
// ============================================================

function App() {
  return (
    <AuthProvider>
      <Router>

        <div className="app-container">

          <DemoSwitcher />

          <Navbar />

          <Routes>

            {/* Dashboard */}
            <Route
              path="/"
              element={<Dashboard />}
            />

            {/* Authentication */}
            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/signup"
              element={<Signup />}
            />

            {/* Raise Doubt */}
            <Route
              path="/raise"
              element={
                <ProtectedRoute>
                  <RaiseDoubt />
                </ProtectedRoute>
              }
            />

            {/* Doubt Chat */}
            <Route
              path="/chat/:doubtId"
              element={
                <ProtectedRoute>
                  <DoubtChat />
                </ProtectedRoute>
              }
            />

            {/* Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* 🏆 Leaderboard */}
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />

            {/* Unknown route */}
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />

          </Routes>

        </div>

      </Router>
    </AuthProvider>
  );
}

export default App;