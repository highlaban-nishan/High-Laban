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

import Connect from './pages/Connect';
import Blog from './pages/Blog';
import StaffOnboarding from './pages/StaffOnboarding';
import WorkerApplication from './pages/WorkerApplication';
import ContactUs from './pages/ContactUs';

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
  const isConnectRoute = location.pathname === '/connect' || location.pathname === '/links';
  const isOnboardingRoute = location.pathname === '/onboarding' || location.pathname === '/apply';

  const DashboardRoute = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.allowedTabs && user.allowedTabs.length > 0) return <AdminDashboard />;
    if (user.role === 'purchaser' || user.role === 'accounts') return <PurchaserDashboard />;
    return <AdminDashboard />;
  };

  return (
    <div className="app-container">
      <Preloader loading={loading} />
      {!isDashboardRoute && location.pathname !== '/login' && location.pathname !== '/franchise-inquiry' && !isConnectRoute && !isOnboardingRoute && (
        <Navbar onOpenFranchise={openFranchise} />
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/franchise-inquiry" element={<FranchiseInquiry />} />
        <Route path="/connect" element={<Connect />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/links" element={<Navigate to="/connect" replace />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/onboarding" element={<StaffOnboarding />} />
        <Route path="/apply" element={<WorkerApplication />} />
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/purchases" element={user ? <PurchaserDashboard /> : <Navigate to="/login" replace />} />
        <Route path="/admin" element={<Navigate to="/login" replace />} />
      </Routes>
      {!isDashboardRoute && location.pathname !== '/login' && !isConnectRoute && !isOnboardingRoute && <Footer />}
      {!isDashboardRoute && location.pathname !== '/login' && !isConnectRoute && !isOnboardingRoute && (
        <MobileNavbar onOpenFranchise={openFranchise} />
      )}
      <FranchiseForm isOpen={franchiseOpen} onClose={closeFranchise} isModal={true} />
    </div>
  );
}

export default App;
