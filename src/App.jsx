import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import AdminRoute from './components/admin/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminUsers from './pages/admin/AdminUsers';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminParking from './pages/admin/AdminParking';
import AdminPricing from './pages/admin/AdminPricing';
import AdminRevenue from './pages/admin/AdminRevenue';
import ErrorBoundary from './ErrorBoundary';
import './index.css';
import loadingVideo from './assets/Loading_car.webm';

function App() {
  const { loading } = useUser();

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', gap: '0' }}>
        <div style={{ width: '400px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video
            src={loadingVideo}
            autoPlay
            loop
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div style={{ marginTop: '-40px', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          <h2> Driving to your spot...</h2>
        </div>
      </div>
    );
  }

  return (
    <>
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
              <Route path="/slot-booking" element={<SlotBookingForm />} />
              <Route path="/ticket" element={<Ticket />} />
              <Route path="/safety" element={<Safety />} />

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
