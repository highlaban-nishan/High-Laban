import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/UI/Navbar';
import MobileNavbar from './components/UI/MobileNavbar'; // Re-adding import
import Footer from './components/Sections/Footer';
import Preloader from './components/UI/Preloader';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import db from './utils/db';
import FranchiseForm from './components/Franchise/FranchiseForm';

function App() {
  const [loading, setLoading] = useState(true);
  const [franchiseOpen, setFranchiseOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);



  const openFranchise = () => setFranchiseOpen(true);
  const closeFranchise = () => setFranchiseOpen(false);

  return (
    <div className="app-container">
      <Preloader loading={loading} />
      {!location.pathname.startsWith('/dashboard') && !location.pathname.startsWith('/admin') && location.pathname !== '/login' && (
        <Navbar onOpenFranchise={openFranchise} />
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            db.getUser() ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/admin" element={<Navigate to="/login" replace />} />
      </Routes>
      {!location.pathname.startsWith('/dashboard') && !location.pathname.startsWith('/admin') && location.pathname !== '/login' && <Footer />}
      {!location.pathname.startsWith('/dashboard') && !location.pathname.startsWith('/admin') && location.pathname !== '/login' && (
        <MobileNavbar onOpenFranchise={openFranchise} />
      )}

      {/* Global Franchise Drawer */}
      <FranchiseForm isOpen={franchiseOpen} onClose={closeFranchise} isModal={true} />
    </div>
  );
}

export default App;
