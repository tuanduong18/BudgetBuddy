// socket.js
import io from 'socket.io-client';

const SOCKET_URL = 'http://192.168.0.2:5000';       // backend IP address

const socket = io(SOCKET_URL, {
  transports: ["websocket"], // force WebSocket
});

export default socket;
