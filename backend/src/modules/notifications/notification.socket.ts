import { getSocketIO } from "../../websocket/socket.instance";
import { notificationRoom } from "../../websocket/socket.rooms";

export function emitNotification(
  userId: string,
  notification: unknown
) {
  try {
    const io = getSocketIO();

    io.to(
      notificationRoom(userId)
    ).emit(
      "notification:new",
      notification
    );
  } catch (error) {
    console.error(
      "Unable to emit notification:",
      error
    );
  }
}