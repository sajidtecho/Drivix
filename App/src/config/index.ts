import { Platform } from 'react-native';

/**
 * Supported Drivix Environment Profiles
 */
export type AppEnvironment = 'production' | 'staging' | 'development';

/**
 * Domain & Endpoint Specifications
 */
export interface EnvironmentConfig {
  env: AppEnvironment;
  domainName: string;
  serverUrl: string;
  apiBaseUrl: string;
  socketUrl: string;
  healthUrl: string;
  timeoutMs: number;
}

// Authoritative Production Cloud Endpoint (Render Backend)
const PRODUCTION_DOMAIN = 'https://drivix-backend-0qvx.onrender.com';

// Local Development Endpoints based on Device / Emulator Architecture
const LOCAL_DEV_DOMAIN = Platform.select({
  android: 'http://10.0.2.2:5000', // Standard Android Emulator loopback to host PC
  ios: 'http://localhost:5000',     // iOS Simulator loopback
  default: 'http://localhost:5000',
});

/**
 * Determine Active Environment Profile
 * Default to production if not explicitly set to development in .env
 */
const resolvedEnv: AppEnvironment =
  (process.env.EXPO_PUBLIC_APP_ENV as AppEnvironment) ||
  (__DEV__ ? 'development' : 'production');

/**
 * Resolve Root Server URL with explicit override precedence:
 * 1. EXPO_PUBLIC_API_URL (if provided in .env / EAS build)
 * 2. EXPO_PUBLIC_CUSTOM_DOMAIN (for custom domain mapping e.g., api.drivix.in)
 * 3. Environment default (Production Render or Local Dev)
 */
const resolveServerUrl = (): string => {
  const explicitApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (explicitApiUrl) {
    return explicitApiUrl.replace(/\/api\/v1\/?$/, '');
  }

  const customDomain = process.env.EXPO_PUBLIC_CUSTOM_DOMAIN;
  if (customDomain) {
    return customDomain.replace(/\/$/, '');
  }

  if (resolvedEnv === 'development' && __DEV__) {
    // If running in development and no cloud URL is forced, use local machine loopback
    return LOCAL_DEV_DOMAIN;
  }

  return PRODUCTION_DOMAIN;
};

const ROOT_SERVER_URL = resolveServerUrl();

export const ENV_CONFIG: EnvironmentConfig = {
  env: resolvedEnv,
  domainName: ROOT_SERVER_URL.replace(/^https?:\/\//, ''),
  serverUrl: ROOT_SERVER_URL,
  apiBaseUrl: `${ROOT_SERVER_URL}/api/v1`,
  socketUrl: ROOT_SERVER_URL,
  healthUrl: `${ROOT_SERVER_URL}/api/v1/health`,
  timeoutMs: 15000,
};

export const API_BASE_URL = ENV_CONFIG.apiBaseUrl;
export const SOCKET_SERVER_URL = ENV_CONFIG.socketUrl;
export const IS_PRODUCTION = resolvedEnv === 'production';

console.log('🌐 [Drivix Domain Mapping]:', {
  environment: ENV_CONFIG.env,
  domain: ENV_CONFIG.domainName,
  apiBaseUrl: ENV_CONFIG.apiBaseUrl,
  socketUrl: ENV_CONFIG.socketUrl,
});

/**
 * Diagnostic utility to verify backend availability and domain connectivity
 */
export const checkBackendHealth = async (): Promise<{
  connected: boolean;
  status?: string;
  latencyMs?: number;
  error?: string;
}> => {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(ENV_CONFIG.healthUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;
    if (response.ok) {
      const data = await response.json();
      return {
        connected: true,
        status: data.status || 'OK',
        latencyMs,
      };
    }
    return {
      connected: false,
      error: `HTTP ${response.status}`,
      latencyMs,
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.name === 'AbortError' ? 'Connection timed out' : err.message,
      latencyMs: Date.now() - startTime,
    };
  }
};
