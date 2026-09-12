import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5001";

export function createSocket(
  accessToken: string
): Socket {
  return io(SOCKET_URL, {
    auth: {
      token: accessToken,
    },

    transports: [
      "websocket",
    ],
  });
}