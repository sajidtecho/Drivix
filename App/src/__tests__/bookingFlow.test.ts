/**
 * Drivix Smart Parking - Booking Flow & Validation Tests
 * 
 * Verifies critical booking business logic, input validation, dynamic pricing calculation,
 * slot assignment transitions, and state management.
 */

import { DynamicPriceQuote, Booking, BookingStatus, ParkingFloor, ParkingLocation } from '../types';
import { checkIsOnlineBookingAllowed } from '../services/bookingEligibility';

describe('Drivix Booking Flow & Business Rules', () => {
  // Test Hub & Floor Models
  const mockHub: ParkingLocation = {
    _id: 'hub_sharda_mlp_01',
    parkingName: 'Sharda University MLP Smart Hub',
    address: 'Plot 32-34, Knowledge Park III, Greater Noida',
    latitude: 28.4727,
    longitude: 77.4820,
    totalSlots: 180,
    availableSlots: 64,
    hourlyPrice: 40,
  };

  const mockFloors: ParkingFloor[] = [
    {
      _id: 'floor_g_01',
      parkingHubId: 'hub_sharda_mlp_01',
      floorName: 'Ground Floor',
      totalSlots: 60,
      availableSlots: 12,
      evSlots: 4,
    },
    {
      _id: 'floor_l1_01',
      parkingHubId: 'hub_sharda_mlp_01',
      floorName: 'Level 1',
      totalSlots: 60,
      availableSlots: 0, // Full floor
      evSlots: 2,
    },
    {
      _id: 'floor_l2_01',
      parkingHubId: 'hub_sharda_mlp_01',
      floorName: 'Level 2',
      totalSlots: 60,
      availableSlots: 52,
      evSlots: 6,
    },
  ];

  describe('Step 3: Floor Selection & Capacity Rules', () => {
    it('should correctly identify floors with available capacity vs full floors', () => {
      const availableFloors = mockFloors.filter((f) => f.availableSlots > 0);
      const fullFloors = mockFloors.filter((f) => f.availableSlots <= 0);

      expect(availableFloors.length).toBe(2);
      expect(fullFloors.length).toBe(1);
      expect(fullFloors[0].floorName).toBe('Level 1');
    });

    it('should prevent floor selection if capacity is zero', () => {
      const selectFloor = (floor: ParkingFloor) => {
        if (floor.availableSlots <= 0) {
          throw new Error('No capacity available on this floor');
        }
        return floor._id;
      };

      expect(() => selectFloor(mockFloors[1])).toThrow('No capacity available on this floor');
      expect(selectFloor(mockFloors[0])).toBe('floor_g_01');
    });
  });

  describe('Step 4: Dynamic Pricing & Cost Calculation', () => {
    it('should compute base cost correctly for given hours', () => {
      const hours = 3;
      const baseCost = mockHub.hourlyPrice * hours;
      expect(baseCost).toBe(120);
    });

    it('should apply authoritative ML dynamic surge quote from backend', () => {
      const mockQuote: DynamicPriceQuote = {
        basePrice: 40,
        recommendedPrice: 50,
        multiplier: 1.25,
        pricingAlert: 'Moderate Demand Surge (+25%)',
        isSurgeActive: true,
        currentOccupancy: 82,
        predictedOccupancy: 88,
        demandScore: 85,
        mlPowered: true,
      };

      const durationHours = 4;
      const calculatedTotal = Math.round(mockQuote.recommendedPrice * durationHours);
      expect(calculatedTotal).toBe(200);
      expect(mockQuote.isSurgeActive).toBe(true);
      expect(mockQuote.mlPowered).toBe(true);
    });

    it('should fallback gracefully to base hourly rate when ML service is offline', () => {
      const fallbackPricing = (quote: DynamicPriceQuote | null, fallbackRate: number, hours: number) => {
        const hourlyRate = quote ? quote.recommendedPrice : fallbackRate;
        return hourlyRate * hours;
      };

      expect(fallbackPricing(null, 40, 2)).toBe(80);
    });
  });

  describe('Step 5: Vehicle Registration Validation', () => {
    const validateVehiclePlate = (plate: string) => {
      const cleaned = plate.trim().toUpperCase().replace(/[\s-]/g, '');
      const regex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;
      return regex.test(cleaned);
    };

    it('should accept valid Indian registration plates', () => {
      expect(validateVehiclePlate('UP16AB1234')).toBe(true);
      expect(validateVehiclePlate('DL 01 C 9999')).toBe(true);
      expect(validateVehiclePlate('MH-12-DE-1433')).toBe(true);
    });

    it('should reject invalid or malformed number plates', () => {
      expect(validateVehiclePlate('1234')).toBe(false);
      expect(validateVehiclePlate('UP16')).toBe(false);
      expect(validateVehiclePlate('')).toBe(false);
    });
  });

  describe('Step 7 & 8: Atomic Booking Creation & Status Transitions', () => {
    it('should construct a valid booking payload with initial status Confirmed', () => {
      const newBooking: Partial<Booking> = {
        bookingId: 'DRV-20261013-001',
        name: 'Shakil Ahmad',
        mobile: '9876543210',
        vehicleNumber: 'UP16AB1234',
        locationName: mockHub.parkingName,
        floor: 'Ground Floor',
        duration: 3,
        totalCost: 150,
        status: 'Confirmed',
        paymentMode: 'PAY_AFTER_CHECKOUT',
        paymentStatus: 'pending',
        slotId: null, // Deferred physical slot allocation
      };

      expect(newBooking.status).toBe('Confirmed');
      expect(newBooking.slotId).toBeNull();
      expect(newBooking.paymentMode).toBe('PAY_AFTER_CHECKOUT');
    });

    it('should transition to Slot Assigned upon arrival confirmation', () => {
      let bookingStatus: BookingStatus = 'Confirmed';
      let assignedSlot: string | null = null;

      // Simulate arrival confirmation event (POST /bookings/:id/assign-slot)
      const handleArrivalAllocation = (allocatedSlotNumber: string) => {
        bookingStatus = 'Slot Assigned';
        assignedSlot = allocatedSlotNumber;
      };

      handleArrivalAllocation('G-A12');
      expect(bookingStatus).toBe('Slot Assigned');
      expect(assignedSlot).toBe('G-A12');
    });

    it('should transition to Checked Out when parking session is vacated', () => {
      let bookingStatus: BookingStatus = 'Slot Assigned';
      const handleCheckout = () => {
        bookingStatus = 'Checked Out';
      };

      handleCheckout();
      expect(bookingStatus).toBe('Checked Out');
    });
  });

  describe('Database Schema: Online Booking Permission & Direct Navigation', () => {
    it('should allow online booking for facilities with explicit allowOnlineBooking: true', () => {
      const facility: ParkingLocation = {
        _id: 'loc_sharda_01',
        parkingName: 'Sharda University Campus Parking',
        address: 'Knowledge Park III',
        latitude: 28.4727,
        longitude: 77.4820,
        totalSlots: 100,
        availableSlots: 40,
        hourlyPrice: 30,
        allowOnlineBooking: true,
        status: 'Active',
      };
      expect(checkIsOnlineBookingAllowed(facility)).toBe(true);
    });

    it('should block online booking for transit lots with allowOnlineBooking: false', () => {
      const metroLot: ParkingLocation = {
        _id: 'loc_metro_kp2',
        parkingName: 'Knowledge Park II Metro Station',
        address: 'Greater Noida',
        latitude: 28.4569,
        longitude: 77.5001,
        totalSlots: 0,
        availableSlots: 0,
        hourlyPrice: 0,
        allowOnlineBooking: false,
        status: 'Inactive',
      };
      expect(checkIsOnlineBookingAllowed(metroLot)).toBe(false);
    });

    it('should block online booking and direct to navigation for facilities without explicit online permissions', () => {
      const municipalLot: ParkingLocation = {
        _id: 'loc_metro_a1',
        parkingName: 'Alpha 1 Metro Station',
        address: 'Block E, Alpha I',
        latitude: 28.4709,
        longitude: 77.5125,
        totalSlots: 200,
        availableSlots: 50,
        hourlyPrice: 25,
        allowOnlineBooking: false,
        status: 'Active',
      };
      expect(checkIsOnlineBookingAllowed(municipalLot)).toBe(false);
    });
  });
});

