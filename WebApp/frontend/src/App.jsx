import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import VehicleServices from './pages/VehicleServices';
import { useUser } from './hooks/useUser';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import SlotLayout from './pages/SlotLayout';
import ParkingList from './pages/ParkingList';
import SlotBookingForm from './pages/SlotBookingForm';
import Ticket from './pages/Ticket';
import Safety from './pages/Safety';
import AnprGateSimulator from './pages/AnprGateSimulator';
import PartnerLandingPage from './pages/PartnerLandingPage';
import ActiveCopilot from './pages/ActiveCopilot';
import AdminRoute from './components/admin/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminUsers from './pages/admin/AdminUsers';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminParking from './pages/admin/AdminParking';
import AdminPricing from './pages/admin/AdminPricing';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminBanners from './pages/admin/AdminBanners';
import AdminPartners from './pages/admin/AdminPartners';
import ErrorBoundary from './ErrorBoundary';
import './index.css';
import LoadingScreen from './components/common/LoadingScreen';

import AboutUs from './pages/AboutUs';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function App() {
  const [showInitialLoader, setShowInitialLoader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitialLoader(false);
    }, 1500); // Less than 2 seconds duration
    return () => clearTimeout(timer);
  }, []);

  if (showInitialLoader) {
    return <LoadingScreen />;
  }

  return (
    <>
      <ScrollToTop />
      <div className="ambient-glow" />
      <div className="ambient-glow-2" />

      <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1, width: '100%' }}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/services" element={<VehicleServices />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />

              {/* Main finding flow */}
              <Route path="/find" element={<ParkingList />} />
              <Route path="/parking" element={<ParkingList />} />
              <Route path="/booking" element={<Navigate to="/find" replace />} />

              {/* Facility-specific pages */}
              <Route path="/slot-layout" element={<SlotLayout />} />
              <Route path="/slot-layout/:id" element={<SlotLayout />} />
              <Route path="/slot-booking" element={<SlotBookingForm />} />
              <Route path="/ticket" element={<Ticket />} />
              <Route path="/safety" element={<Safety />} />
              <Route path="/anpr" element={<AnprGateSimulator />} />
              <Route path="/partner" element={<PartnerLandingPage />} />
              <Route path="/copilot" element={<ActiveCopilot />} />
              <Route path="/about" element={<AboutUs />} />

              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="bookings" element={<AdminBookings />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="complaints" element={<AdminComplaints />} />
                  <Route path="parking" element={<AdminParking />} />
                  <Route path="pricing" element={<AdminPricing />} />
                  <Route path="revenue" element={<AdminRevenue />} />
                  <Route path="banners" element={<AdminBanners />} />
                  <Route path="partners" element={<AdminPartners />} />
                </Route>
              </Route>
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </>
  );
}

export default App;
