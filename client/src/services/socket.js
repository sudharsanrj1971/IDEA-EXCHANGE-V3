import { io } from 'socket.io-client';

const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000';

/**
 * SECURED SOCKET.IO SINGLETON
 * FIX 07: withCredentials activated for cookie-based authentication in handshake.
 */
class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket) return;
    
    this.socket = io(URL, {
      withCredentials: true, // Crucial for reading accessToken cookie on server
      autoConnect: true,
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('[SOCKET] Connection established');
    });

    this.socket.on('connect_error', (err) => {
      if (err.message === 'ACCOUNT_SUSPENDED') {
        console.error('[SECURITY] Active session terminated: Account Banned');
        window.location.href = '/login?reason=banned';
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinProject(id) {
    this.socket?.emit('joinProject', id);
  }

  leaveProject(id) {
    this.socket?.emit('leaveProject', id);
  }

  on(event, callback) {
    this.socket?.on(event, callback);
  }

  off(event, callback) {
    this.socket?.off(event, callback);
  }
}

const socketInstance = new SocketService();
export default socketInstance;
