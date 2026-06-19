import { io, Socket } from 'socket.io-client';

const apiBaseUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
// Extract just the origin (e.g. http://localhost:5000) for socket.io so we don't connect to a namespace
const SOCKET_URL = new URL(apiBaseUrl).origin;

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL);

      this.socket.on('connect', () => {
        console.log('Connected to socket server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Event listeners
  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }
}

export const socketService = new SocketService();
