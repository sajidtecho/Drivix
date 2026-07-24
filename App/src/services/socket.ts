import { io, Socket } from 'socket.io-client';
import { AppState, AppStateStatus } from 'react-native';
import { API_BASE_URL } from './api';

const SOCKET_SERVER_URL = API_BASE_URL.replace('/api/v1', '');

class SocketService {
  private socket: Socket | null = null;
  private appStateSubscription: any = null;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO: Connected to server successfully');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO: Disconnected from server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO: Connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('Socket.IO: Disconnected manually');
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Listen to an incoming Socket.IO event.
   */
  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.on(event, callback);
  }

  /**
   * Stop listening to a Socket.IO event.
   */
  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  /**
   * Emit an event to the Socket.IO server.
   */
  emit(event: string, data: any) {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.emit(event, data);
  }

  /**
   * Monitor background/foreground lifecycles to pause WebSocket resource consumption
   */
  setupAppStateLifecycle() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      console.log(`Socket.IO: AppState transitioned to: ${nextAppState}`);
      if (nextAppState === 'active') {
        // App is in foreground: reconnect
        this.connect();
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App is in background/inactive: disconnect to save resources
        this.disconnect();
      }
    });

    // Run initial connection
    this.connect();
  }

  /**
   * Completely clean up listeners and connection
   */
  cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.disconnect();
  }
}

export const socketService = new SocketService();
export default socketService;
