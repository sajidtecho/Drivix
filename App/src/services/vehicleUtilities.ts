/**
 * Drivix Smart Mobility - Vehicle Utilities & Automotive Services (Park+ Parity)
 * FASTag management, E-Challan lookup/settlement, Fuel & EV Radar, and Roadside SOS.
 */

export interface FASTagAccount {
  plate: string;
  tagId: string;
  balance: number;
  bank: string;
  status: 'active' | 'low_balance' | 'inactive';
  lastRecharged?: string;
}

export interface ChallanItem {
  id: string;
  challanNumber: string;
  plate: string;
  violation: string;
  location: string;
  date: string;
  amount: number;
  status: 'pending' | 'settled';
  courtAssisted?: boolean;
}

export interface FuelRateData {
  city: string;
  petrol: number;
  diesel: number;
  cng: number;
  evRatePerKWh: number;
  trend: 'stable' | 'down' | 'up';
  lastUpdated: string;
}

export const NCR_FUEL_RATES: FuelRateData = {
  city: 'Delhi NCR (Noida / Greater Noida)',
  petrol: 94.72,
  diesel: 87.62,
  cng: 75.09,
  evRatePerKWh: 18.5,
  trend: 'stable',
  lastUpdated: 'Today, 6:00 AM',
};

// Default FASTag state for primary vehicle
export const getInitialFASTagAccount = (plate: string): FASTagAccount => {
  const clean = plate ? plate.toUpperCase().replace(/\s/g, '') : 'DL01AB1234';
  return {
    plate: clean,
    tagId: `NETC-${clean.slice(-4)}-9912`,
    balance: 480,
    bank: 'ICICI FASTag (NETC)',
    status: 'active',
    lastRecharged: '3 days ago',
  };
};

export const fetchChallansForPlate = (plate: string): ChallanItem[] => {
  // Never generate fake / mock challans. Return empty array (0 pending violations).
  return [];
};

export const ROADSIDE_SERVICES = [
  {
    id: 'towing',
    title: 'Flatbed Towing',
    subtitle: 'Safe transit to nearest verified service station or hub',
    eta: '20-30 mins',
    icon: 'Truck',
  },
  {
    id: 'flat_tire',
    title: 'Puncture & Tire Swap',
    subtitle: 'On-site spare tire fitment & high-pressure nitrogen fill',
    eta: '15-20 mins',
    icon: 'Disc',
  },
  {
    id: 'jumpstart',
    title: 'Battery Jumpstart',
    subtitle: '12V heavy-duty booster cables & voltage health check',
    eta: '15-25 mins',
    icon: 'Zap',
  },
  {
    id: 'lockout',
    title: 'Key Lockout Assistance',
    subtitle: 'Professional damage-free electronic vehicle entry unlock',
    eta: '25-35 mins',
    icon: 'Key',
  },
];

export interface ExpresswayRoute {
  id: string;
  name: string;
  fromTo: string;
  oneWayToll: number;
  roundTripToll: number;
  distanceKm: number;
  plazas: string;
}

export const NCR_EXPRESSWAY_ROUTES: ExpresswayRoute[] = [
  {
    id: 'yamuna_exp',
    name: 'Yamuna Expressway',
    fromTo: 'Gr. Noida ⇄ Jewar / Agra',
    oneWayToll: 340,
    roundTripToll: 540,
    distanceKm: 165,
    plazas: 'Jewar, Mathura, Khandauli',
  },
  {
    id: 'delhi_meerut_exp',
    name: 'Delhi-Meerut Expressway',
    fromTo: 'Akshardham ⇄ Dasna / Meerut',
    oneWayToll: 160,
    roundTripToll: 255,
    distanceKm: 82,
    plazas: 'Chhajarsi, Kashi',
  },
  {
    id: 'eastern_peripheral',
    name: 'Eastern Peripheral (EPE)',
    fromTo: 'Kundli ⇄ Palwal via Noida',
    oneWayToll: 220,
    roundTripToll: 350,
    distanceKm: 135,
    plazas: 'Duhai, Bilaspur, Dadri',
  },
  {
    id: 'delhi_gurgaon',
    name: 'Delhi-Gurugram Expressway',
    fromTo: 'Dhaula Kuan ⇄ Manesar',
    oneWayToll: 80,
    roundTripToll: 125,
    distanceKm: 38,
    plazas: 'Kherki Daula Plaza',
  },
  {
    id: 'noida_gr_noida',
    name: 'Noida-Gr. Noida Expressway',
    fromTo: 'Sec 15 ⇄ Pari Chowk',
    oneWayToll: 0,
    roundTripToll: 0,
    distanceKm: 24,
    plazas: 'Toll-Free Express Corridor',
  },
];

