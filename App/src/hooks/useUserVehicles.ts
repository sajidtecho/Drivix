import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/services/api';
import { RegisteredVehicle } from '@/types/user';

export function useUserVehicles(isAuthenticated: boolean, step: string) {
  const [vehicles, setVehicles] = useState<RegisteredVehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchVehicles = useCallback(async () => {
    if (!isAuthenticated) {
      setVehicles([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data || []);
    } catch (err) {
      console.warn('Error fetching user vehicles:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles, isAuthenticated]);

  useEffect(() => {
    if (step === 'MAP' || step === 'CHECKOUT') {
      fetchVehicles();
    }
  }, [step, fetchVehicles]);

  const primaryVehicle = useMemo(() => {
    if (vehicles.length === 0) return null;
    return vehicles.find((v) => v.isPrimary) || vehicles[0];
  }, [vehicles]);

  return {
    vehicles,
    primaryVehicle,
    loading,
    refreshVehicles: fetchVehicles,
  };
}
