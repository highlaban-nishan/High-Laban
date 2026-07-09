import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/UI/Navbar';
import MobileNavbar from './components/UI/MobileNavbar';
import Footer from './components/Sections/Footer';
import Preloader from './components/UI/Preloader';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import PurchaserDashboard from './pages/PurchaserDashboard';
import FranchiseInquiry from './pages/FranchiseInquiry';
import AboutUs from './pages/AboutUs';
import db from './utils/db';
import FranchiseForm from './components/Franchise/FranchiseForm';

function App() {
  const [loading, setLoading] = useState(true);
  const [franchiseOpen, setFranchiseOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const openFranchise = () => setFranchiseOpen(true);
  const closeFranchise = () => setFranchiseOpen(false);

  const user = db.getUser();
  const isDashboardRoute = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/purchases');

  const DashboardRoute = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.allowedTabs && user.allowedTabs.length > 0) return <AdminDashboard />;
    if (user.role === 'purchaser' || user.role === 'accounts') return <PurchaserDashboard />;
    return <AdminDashboard />;
  };

  return (
    <div className="app-container">
      <Preloader loading={loading} />
      {!isDashboardRoute && location.pathname !== '/login' && location.pathname !== '/franchise-inquiry' && (
        <Navbar onOpenFranchise={openFranchise} />
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/franchise-inquiry" element={<FranchiseInquiry />} />
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/purchases" element={user ? <PurchaserDashboard /> : <Navigate to="/login" replace />} />
        <Route path="/admin" element={<Navigate to="/login" replace />} />
      </Routes>
      {!isDashboardRoute && location.pathname !== '/login' && <Footer />}
      {!isDashboardRoute && location.pathname !== '/login' && (
        <MobileNavbar onOpenFranchise={openFranchise} />
      )}
      <FranchiseForm isOpen={franchiseOpen} onClose={closeFranchise} isModal={true} />
    </div>
  );
}

export default App;
