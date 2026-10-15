import { VehicleCareService, VehicleDocument } from '../types';

export const IN_HUB_VEHICLE_SERVICES: VehicleCareService[] = [
  {
    id: 'eco_foam_wash',
    name: 'Premium Top Wash & Foam',
    tagline: 'High-pressure foam rinse, glass cleaning & tire dressing',
    price: 299,
    durationMinutes: 30,
    category: 'wash',
    icon: 'Sparkles',
    popular: true,
  },
  {
    id: 'deep_interior_spa',
    name: 'Car Interior Spa & Sanitisation',
    tagline: 'Deep vacuuming, seat shampooing, dashboard gloss & AC vent anti-bacterial treatment',
    price: 699,
    durationMinutes: 60,
    category: 'detail',
    icon: 'Wind',
    popular: true,
  },
  {
    id: 'full_360_spa',
    name: '360° Deep All-Round Spa',
    tagline: 'Full exterior rubbing & wax polish + complete interior steam dry-cleaning',
    price: 1299,
    durationMinutes: 90,
    category: 'detail',
    icon: 'Sparkles',
    popular: true,
  },
  {
    id: 'pest_repellent_treatment',
    name: 'Rat & Pest Repellent Shield',
    tagline: 'Engine bay wiring spray & cabin repellent coating (protects against rodent wire damage)',
    price: 499,
    durationMinutes: 25,
    category: 'maintenance',
    icon: 'ShieldCheck',
    popular: false,
  },
  {
    id: 'tire_nitrogen_check',
    name: 'Tire Nitrogen Refill & Tread Check',
    tagline: '4-wheel nitrogen calibration, tire tread depth gauge & valve inspection',
    price: 99,
    durationMinutes: 15,
    category: 'maintenance',
    icon: 'Gauge',
    popular: false,
  },
  {
    id: 'ev_plug_charge',
    name: 'EV Supercharge Top-Up Concierge',
    tagline: 'Dedicated Level 2/3 fast charger plugged in while parked up to 85% battery',
    price: 299,
    durationMinutes: 45,
    category: 'ev',
    icon: 'Zap',
    popular: true,
  },
];

/**
 * Calculates days remaining until document expiration and returns valid status
 */
export const calculateDocumentStatus = (expiryDateStr: string): {
  status: 'valid' | 'expiring_soon' | 'expired';
  daysRemaining: number;
  displayText: string;
} => {
  if (!expiryDateStr) {
    return { status: 'valid', daysRemaining: 365, displayText: 'Valid' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      status: 'expired',
      daysRemaining,
      displayText: `Expired ${Math.abs(daysRemaining)}d ago`,
    };
  }

  if (daysRemaining <= 30) {
    return {
      status: 'expiring_soon',
      daysRemaining,
      displayText: `Expires in ${daysRemaining} days`,
    };
  }

  return {
    status: 'valid',
    daysRemaining,
    displayText: `Valid (${daysRemaining}d left)`,
  };
};

/**
 * Returns empty array by default to avoid showing mock/false documents
 */
export const getDefaultVehicleDocuments = (_vehiclePlate: string): VehicleDocument[] => {
  return [];
};

