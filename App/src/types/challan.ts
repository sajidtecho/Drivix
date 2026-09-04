export interface ChallanRecord {
  id: string;
  challanNumber: string;
  vehicleNumber: string;
  offense: string;
  location: string;
  date: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'DISPUTED';
  dueDate: string;
  evidenceImageUrl?: string;
}
