import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { Booking } from '@/types/booking';

export function useActiveBooking(isAuthenticated: boolean, step: string) {
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchActiveBooking = useCallback(async () => {
    if (!isAuthenticated) {
      setActiveBooking(null);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/bookings/my');
      const list: Booking[] = res.data || [];
      const active = list.find((b) => b.status === 'booked' || b.status === 'Checked In');
      setActiveBooking(active || null);
    } catch (err) {
      console.warn('Error fetching active booking:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchActiveBooking();
  }, [fetchActiveBooking, isAuthenticated]);

  useEffect(() => {
    if (step === 'MAP') {
      fetchActiveBooking();
    }
  }, [step, fetchActiveBooking]);

  useEffect(() => {
    if (!activeBooking) {
      setTimeLeft('');
      return;
    }

    const calculateTimeLeft = () => {
      try {
        if (!activeBooking.entryDate || !activeBooking.entryTime) {
          setTimeLeft('');
          return;
        }

        const [year, month, day] = activeBooking.entryDate.split('-').map(Number);
        const [hour, minute] = activeBooking.entryTime.split(':').map(Number);
        const duration = activeBooking.durationHours || activeBooking.duration || 1;
        const startTime = new Date(year, month - 1, day, hour, minute);
        const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
        const now = new Date();
        const diff = endTime.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeLeft('EXPIRED');
        } else {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${h}h ${m}m ${s}s`);
        }
      } catch (err) {
        console.warn('Error calculating remaining booking time:', err);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [activeBooking]);

  return {
    activeBooking,
    timeLeft,
    loading,
    refreshActiveBooking: fetchActiveBooking,
  };
}
