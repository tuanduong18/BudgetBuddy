/**
 * Shared Socket.IO client instance.
 *
 * A single socket is created at module load time and reused across the app.
 * Forcing the "websocket" transport skips the HTTP long-polling fallback,
 * which is required because the backend uses eventlet (not gevent) and does
 * not support the polling transport reliably in production.
 *
 * Screens that need real-time updates import this singleton directly rather
 * than creating their own connections, keeping the number of open sockets to one.
 */
import io from 'socket.io-client';
import { API_BASE } from './api';

const socket = io(API_BASE, {
  // Force WebSocket transport; avoids incompatibilities with the eventlet async server.
  transports: ['websocket'],
});

export default socket;
