import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ParkingLocation, ParkingFloor, DynamicPriceQuote, Booking } from '../types';
import { parkingApi } from '../api/parkingApi';
import { bookingApi, CreateBookingPayload } from '../api/bookingApi';

interface BookingContextType {
  selectedHub: ParkingLocation | null;
  selectedFloor: ParkingFloor | null;
  entryDate: string;
  entryTime: string;
  durationHours: number;
  vehicleNumber: string;
  vehicleName: string;
  vehicleId: string | null;
  pricingQuote: DynamicPriceQuote | null;
  totalCost: number;
  selectedServices: Array<{ id: string; name: string; price: number; icon: string; tagline: string }>;
  servicesCost: number;
  isCalculatingPrice: boolean;
  isSubmittingBooking: boolean;
  confirmedBooking: Booking | null;
  activeBooking: Booking | null;
  
  // Actions
  selectHub: (hub: ParkingLocation) => void;
  selectFloor: (floor: ParkingFloor) => void;
  setTimeAndDuration: (date: string, time: string, duration: number) => void;
  setVehicleInfo: (number: string, name: string, id?: string | null) => void;
  toggleService: (service: { id: string; name: string; price: number; icon: string; tagline: string }) => void;
  clearServices: () => void;
  refreshPriceQuote: () => Promise<void>;
  confirmBooking: (paymentMode: 'PAY_NOW' | 'PAY_AFTER_CHECKOUT', userDetails: { name: string; mobile: string }) => Promise<Booking>;
  setActiveBooking: (booking: Booking | null) => void;
  resetBookingDraft: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const getDefaultTime = () => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(Math.ceil(d.getMinutes() / 15) * 15 % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getDefaultDate = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedHub, setSelectedHub] = useState<ParkingLocation | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<ParkingFloor | null>(null);
  const [entryDate, setEntryDate] = useState<string>(getDefaultDate());
  const [entryTime, setEntryTime] = useState<string>(getDefaultTime());
  const [durationHours, setDurationHours] = useState<number>(2);
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [vehicleName, setVehicleName] = useState<string>('');
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<Array<{ id: string; name: string; price: number; icon: string; tagline: string }>>([]);
  const [pricingQuote, setPricingQuote] = useState<DynamicPriceQuote | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState<boolean>(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  const selectHub = (hub: ParkingLocation) => {
    setSelectedHub(hub);
    setSelectedFloor(null);
    setPricingQuote(null);
  };

  const selectFloor = (floor: ParkingFloor) => {
    setSelectedFloor(floor);
  };

  const setTimeAndDuration = (date: string, time: string, duration: number) => {
    setEntryDate(date);
    setEntryTime(time);
    setDurationHours(duration);
  };

  const setVehicleInfo = (number: string, name: string, id?: string | null) => {
    setVehicleNumber(number.toUpperCase().replace(/\s/g, ''));
    setVehicleName(name);
    if (id !== undefined) setVehicleId(id);
  };

  const toggleService = (service: { id: string; name: string; price: number; icon: string; tagline: string }) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === service.id);
      if (exists) {
        return prev.filter((s) => s.id !== service.id);
      }
      return [...prev, service];
    });
  };

  const clearServices = () => {
    setSelectedServices([]);
  };

  const servicesCost = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const refreshPriceQuote = async () => {
    if (!selectedHub) return;
    setIsCalculatingPrice(true);
    try {
      const quote = await parkingApi.getPricingRecommendation(selectedHub._id, {
        durationHours,
      });
      setPricingQuote(quote);
    } catch (err) {
      console.warn('[BookingContext] Price quote fallback:', err);
      // Fallback calculation using hub hourly price
      const basePrice = selectedHub.hourlyPrice || 60;
      setPricingQuote({
        basePrice,
        recommendedPrice: basePrice,
        multiplier: 1.0,
        pricingAlert: 'Normal Rate',
        isSurgeActive: false,
        currentOccupancy: 50,
        predictedOccupancy: 50,
        demandScore: 50,
        mlPowered: false,
      });
    } finally {
      setIsCalculatingPrice(false);
    }
  };

  const calculateTotalCost = (): number => {
    let parkingBase = 60 * durationHours;
    if (pricingQuote) {
      parkingBase = pricingQuote.recommendedPrice * durationHours;
    } else if (selectedHub) {
      parkingBase = selectedHub.hourlyPrice * durationHours;
    }
    return Math.round(parkingBase + servicesCost);
  };

  const confirmBooking = async (
    paymentMode: 'PAY_NOW' | 'PAY_AFTER_CHECKOUT',
    userDetails: { name: string; mobile: string }
  ): Promise<Booking> => {
    if (!selectedHub || !selectedFloor) {
      throw new Error('Please select a parking hub and floor before booking.');
    }

    setIsSubmittingBooking(true);
    try {
      const calculatedCost = calculateTotalCost();
      const payload: CreateBookingPayload = {
        name: userDetails.name || 'Drivix User',
        mobile: userDetails.mobile || '9999999999',
        vehicleNumber: vehicleNumber || 'DL01AB1234',
        vehicleName: vehicleName || 'Car',
        vehicleId: vehicleId || undefined,
        parkingHubId: selectedHub._id,
        floorId: selectedFloor._id,
        floor: selectedFloor.floorName,
        locationId: selectedHub._id,
        locationName: selectedHub.parkingName,
        bookingDate: entryDate,
        entryDate: entryDate,
        startTime: entryTime,
        entryTime: entryTime,
        duration: durationHours,
        totalCost: calculatedCost,
        paymentMode,
        additionalServices: selectedServices.map((s) => s.name),
        servicesCost,
      };

      const booking = await bookingApi.createBooking(payload);
      setConfirmedBooking(booking);
      setActiveBooking(booking);
      return booking;
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const resetBookingDraft = () => {
    setSelectedHub(null);
    setSelectedFloor(null);
    setEntryDate(getDefaultDate());
    setEntryTime(getDefaultTime());
    setDurationHours(2);
    setVehicleNumber('');
    setVehicleName('');
    setVehicleId(null);
    setPricingQuote(null);
    setConfirmedBooking(null);
  };

  return (
    <BookingContext.Provider
      value={{
        selectedHub,
        selectedFloor,
        entryDate,
        entryTime,
        durationHours,
        vehicleNumber,
        vehicleName,
        vehicleId,
        pricingQuote,
        totalCost: calculateTotalCost(),
        selectedServices,
        servicesCost,
        isCalculatingPrice,
        isSubmittingBooking,
        confirmedBooking,
        activeBooking,
        selectHub,
        selectFloor,
        setTimeAndDuration,
        setVehicleInfo,
        toggleService,
        clearServices,
        refreshPriceQuote,
        confirmBooking,
        setActiveBooking,
        resetBookingDraft,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
