// src/App.jsx

import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import { AuthPage } from './pages/Auth';
import { HomePage } from './pages/HomePage';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppRoutes() {
  const { session } = useAuth();

  return (
    <Routes>
      <Route path="/" element={!session ? <Navigate to="/auth" /> : <HomePage />} />
      <Route path="/auth" element={session ? <Navigate to="/" /> : <AuthPage />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;