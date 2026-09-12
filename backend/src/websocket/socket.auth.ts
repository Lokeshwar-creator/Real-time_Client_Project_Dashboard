import { Socket } from "socket.io";

import { verifyAccessToken } from "../utils/jwt";

export interface SocketUser {
  userId: string;
  role: string;
}

export function authenticateSocket(
  socket: Socket,
  next: (err?: Error) => void
) {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(
        new Error("Authentication token required")
      );
    }

    const payload = verifyAccessToken(token);

    socket.data.user = {
      userId: payload.userId,
      role: payload.role,
    } as SocketUser;

    next();
  } catch {
    next(
      new Error("Invalid or expired access token")
    );
  }
}