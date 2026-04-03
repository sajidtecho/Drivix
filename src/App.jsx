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
import './index.css';
import { DotLottiePlayer } from '@dotlottie/react-player';

function App() {
  const { loading } = useUser();

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', gap: '0' }}>
        <div style={{ width: '300px', height: '300px' }}>
          <DotLottiePlayer
            src="https://lottie.host/880a42df-e932-4740-96f8-45e0fb5c88da/8M88rG9c6J.json"
            autoplay
            loop
          />
        </div>
        <div style={{ marginTop: '-40px', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          Driving to your spot...
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
          </Routes>
        </main>
      </div>
    </>
  );
}

export default App;
