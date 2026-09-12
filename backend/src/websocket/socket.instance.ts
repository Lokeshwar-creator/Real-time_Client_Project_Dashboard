import { Server } from "socket.io";

let io: Server | null = null;

export function setSocketIO(
  socketServer: Server
) {
  io = socketServer;
}

export function getSocketIO(): Server {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized"
    );
  }

  return io;
}