export interface UserDocument {
  id?: string;
  type: 'DL' | 'PUC' | 'RC' | 'INSURANCE';
  documentNumber?: string;
  expiryDate?: string; // DD/MM/YYYY
  fileUrl?: string;
  verified?: boolean;
}

export interface DocumentComplianceStatus {
  status: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: any;
}

export interface RegisteredVehicle {
  id: string;
  _id?: string;
  plate: string;
  vehicleNumber?: string;
  model: string;
  type: 'car' | 'bike' | 'ev' | 'truck';
  brand?: string;
  isPrimary?: boolean;
  fastagBalance?: number;
  fastagId?: string;
  pucExpiry?: string;
  insuranceExpiry?: string;
}

export interface FASTagAccount {
  id: string;
  tagId: string;
  vehicleNumber: string;
  balance: number;
  provider: string;
  status: 'active' | 'low_balance' | 'blocked';
  autoRechargeEnabled?: boolean;
  autoRechargeThreshold?: number;
}

export interface UserProfile {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  walletBalance?: number;
  documents?: UserDocument[];
  vehicles?: RegisteredVehicle[];
  avatarUrl?: string;
}
