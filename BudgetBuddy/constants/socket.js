// socket.js
import io from 'socket.io-client';
import { API_BASE } from './api';

const SOCKET_URL = API_BASE;       // backend IP address

const socket = io(SOCKET_URL, {
  transports: ["websocket"], // force WebSocket
});

export default socket;
