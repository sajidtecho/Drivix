export interface CopilotTelemetry {
  userId?: string;
  speed: number;
  latitude?: number;
  longitude?: number;
  eyeOpenness?: number;
  gazeDirection?: 'FORWARD' | 'LEFT' | 'RIGHT' | 'DOWN';
  drowsinessScore: number;
  isDrowsy: boolean;
  phoneDistraction: boolean;
  timestamp: string;
}

export interface SafetyAlert {
  id: string;
  type: 'DROWSINESS' | 'PHONE_DISTRACTION' | 'SPEEDING' | 'LANE_DEPARTURE';
  severity: 'WARNING' | 'CRITICAL';
  message: string;
  timestamp: string;
  userId?: string;
}

export interface DriverScore {
  overallScore: number;
  drowsinessEventsCount: number;
  distractionEventsCount: number;
  smoothDrivingRating: number;
  totalTripsCount: number;
}
