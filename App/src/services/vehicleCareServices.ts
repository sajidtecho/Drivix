import { VehicleCareService, VehicleDocument } from '../types';

export const IN_HUB_VEHICLE_SERVICES: VehicleCareService[] = [
  {
    id: 'eco_foam_wash',
    name: 'Eco Foam Waterless Wash',
    tagline: 'Zero-scratch biodegradable polish & glass treatment in-bay',
    price: 299,
    durationMinutes: 30,
    category: 'wash',
    icon: 'Sparkles',
    popular: true,
  },
  {
    id: 'interior_vacuum',
    name: 'Interior Cabin Deep Vacuum',
    tagline: 'Floor mats, seat fabric & AC vent deodorizing treatment',
    price: 199,
    durationMinutes: 20,
    category: 'detail',
    icon: 'Wind',
    popular: false,
  },
  {
    id: 'tire_nitrogen_check',
    name: 'Tire Nitrogen & Pressure Calibration',
    tagline: '4-wheel nitrogen refill, tread depth & TPMS check',
    price: 99,
    durationMinutes: 10,
    category: 'maintenance',
    icon: 'Gauge',
    popular: false,
  },
  {
    id: 'ev_plug_charge',
    name: 'EV Charging Top-Up Concierge',
    tagline: 'Dedicated fast charger connection up to 80% SOC',
    price: 250,
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
 * Default sample documents for demo/startup-ready vehicles
 */
export const getDefaultVehicleDocuments = (vehiclePlate: string): VehicleDocument[] => {
  const currentYear = new Date().getFullYear();
  return [
    {
      id: `rc_${vehiclePlate}`,
      type: 'RC',
      documentNumber: `REG-${vehiclePlate.replace(/\s/g, '')}`,
      expiryDate: `${currentYear + 8}-04-15`,
      issuer: 'MoRTH Parivahan',
      status: 'valid',
      daysRemaining: 2900,
    },
    {
      id: `ins_${vehiclePlate}`,
      type: 'Insurance',
      documentNumber: `POL-ICICI-88910`,
      expiryDate: `${currentYear}-11-20`,
      issuer: 'ICICI Lombard Comprehensive',
      status: 'expiring_soon',
      daysRemaining: 37,
    },
    {
      id: `puc_${vehiclePlate}`,
      type: 'PUCC',
      documentNumber: `PUC-UP16-9023`,
      expiryDate: `${currentYear}-10-28`,
      issuer: 'Green Bharat Emission Lab',
      status: 'expiring_soon',
      daysRemaining: 14,
    },
    {
      id: `dl_${vehiclePlate}`,
      type: 'Driving License',
      documentNumber: `DL-04201800921`,
      expiryDate: `${currentYear + 12}-01-10`,
      issuer: 'Delhi Transport Department',
      status: 'valid',
      daysRemaining: 4400,
    },
  ];
};
