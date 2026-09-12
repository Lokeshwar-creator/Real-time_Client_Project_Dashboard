import { Server } from "socket.io";
import { Role } from "@prisma/client";

import { env } from "../config/env";
import { prisma } from "../config/database";
import {
  joinAuthorizedRooms,
  PRESENCE_ROOM,
  notificationRoom,
  ADMIN_ACTIVITY_ROOM,
} from "./socket.rooms";

import {
  authenticateSocket,
  SocketUser,
} from "./socket.auth";

import {
  setSocketIO,
} from "./socket.instance";
import {
  connectUser,
  disconnectUser,
  getOnlineUsers,
} from "./presence.store";

/**
 * ---------------------------------------------------------
 * INITIALIZE SOCKET.IO
 * ---------------------------------------------------------
 *
 * IMPORTANT:
 * This function does NOT call listen().
 *
 * server.ts owns the HTTP server and port.
 */
export function initializeSocket(
  httpServer: any
) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.frontendUrl,
      credentials: true,
    },
  });

  /**
   * Make Socket.IO available to services.
   */
  setSocketIO(io);

  /**
   * -------------------------------------------------------
   * SOCKET AUTHENTICATION
   * -------------------------------------------------------
   */

  io.use(authenticateSocket);

  /**
   * -------------------------------------------------------
   * CONNECTION
   * -------------------------------------------------------
   */

  io.on("connection", async (socket) => {
    try {
      const user =
        socket.data.user as SocketUser;

      console.log(
        `Socket connected: ${user.userId}`
      );

      /**
       * Join only the rooms that this user
       * is authorized to access.
       */
      await joinAuthorizedRooms(
        socket,
        user
      );

      await socket.join(
        notificationRoom(user.userId)
      );

      /**
       * ---------------------------------------------------
       * PRESENCE
       * ---------------------------------------------------
       */

      await socket.join(
        PRESENCE_ROOM
      );

      const becameOnline = connectUser(user.userId);
      const presencePayload = {
        count: getOnlineUsers().length,
        userIds: getOnlineUsers(),
      };

      // Only administrators receive the complete user list/count.
      if (user.role === Role.ADMIN) {
        socket.emit("presence:users", presencePayload);
      }

      if (becameOnline) {
        socket.to(PRESENCE_ROOM).emit("presence:user-online", {
          userId: user.userId,
          online: true,
        });
        io.to(ADMIN_ACTIVITY_ROOM).emit("presence:users", presencePayload);
      }

      /**
       * ---------------------------------------------------
       * OFFLINE ACTIVITY CATCH-UP
       * ---------------------------------------------------
       */

      socket.on(
        "activity:catch-up",
        async (data) => {
          try {
            const lastSeenAt =
              data?.lastSeenAt
                ? new Date(
                    data.lastSeenAt
                  )
                : new Date(0);

            if (
              Number.isNaN(
                lastSeenAt.getTime()
              )
            ) {
              socket.emit(
                "activity:catch-up-error",
                {
                  message:
                    "Invalid lastSeenAt",
                }
              );

              return;
            }

            let activities: Awaited<
              ReturnType<
                typeof prisma.activityLog.findMany
              >
            > = [];

            /**
             * ---------------------------------------------
             * ADMIN
             * ---------------------------------------------
             */

            if (
              user.role === Role.ADMIN
            ) {
              activities =
                await prisma.activityLog.findMany({
                  where: {
                    createdAt: {
                      gt: lastSeenAt,
                    },
                  },

                  orderBy: {
                    createdAt: "desc",
                  },

                  take: 20,

                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        role: true,
                      },
                    },

                    task: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },

                    project: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                });
            }

            /**
             * ---------------------------------------------
             * PROJECT MANAGER
             * ---------------------------------------------
             */

            else if (
              user.role ===
              Role.PROJECT_MANAGER
            ) {
              activities =
                await prisma.activityLog.findMany({
                  where: {
                    createdAt: {
                      gt: lastSeenAt,
                    },

                    project: {
                      managerId:
                        user.userId,
                    },
                  },

                  orderBy: {
                    createdAt: "desc",
                  },

                  take: 20,

                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        role: true,
                      },
                    },

                    task: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },

                    project: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                });
            }

            /**
             * ---------------------------------------------
             * DEVELOPER
             * ---------------------------------------------
             */

            else if (
              user.role ===
              Role.DEVELOPER
            ) {
              activities =
                await prisma.activityLog.findMany({
                  where: {
                    createdAt: {
                      gt: lastSeenAt,
                    },

                    task: {
                      developerId:
                        user.userId,
                    },
                  },

                  orderBy: {
                    createdAt: "desc",
                  },

                  take: 20,

                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        role: true,
                      },
                    },

                    task: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },

                    project: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                });
            }

            else {
              activities = [];
            }

            socket.emit(
              "activity:catch-up",
              {
                activities,
              }
            );
          } catch (error) {
            console.error(
              "Activity catch-up error:",
              error
            );

            socket.emit(
              "activity:catch-up-error",
              {
                message:
                  "Unable to load missed activities",
              }
            );
          }
        }
      );

      /**
       * ---------------------------------------------------
       * DISCONNECT
       * ---------------------------------------------------
       */

      socket.on(
        "disconnect",
        () => {
          console.log(
            `Socket disconnected: ${user.userId}`
          );

          const becameOffline = disconnectUser(user.userId);

          if (becameOffline) {
            const presencePayload = {
              count: getOnlineUsers().length,
              userIds: getOnlineUsers(),
            };

            io.to(PRESENCE_ROOM).emit("presence:user-offline", {
              userId: user.userId,
              online: false,
            });
            io.to(ADMIN_ACTIVITY_ROOM).emit("presence:users", presencePayload);
          }
        }
      );
    } catch (error) {
      console.error(
        "Socket connection error:",
        error
      );
    }
  });

  return io;
}
