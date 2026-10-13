// Drivix Web Frontend — Production & Custom Domain Configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_CUSTOM_DOMAIN ||
  (import.meta.env.DEV ? 'http://localhost:5000' : 'https://drivix-backend-0qvx.onrender.com');

export const SOCKET_SERVER_URL = API_BASE_URL;

console.log('🌐 [WebApp Domain Mapping]:', {
  apiBaseUrl: API_BASE_URL,
  mode: import.meta.env.MODE,
});
