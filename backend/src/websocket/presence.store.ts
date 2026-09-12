const connectionCounts = new Map<string, number>();

export function connectUser(userId: string) {
  const previousCount = connectionCounts.get(userId) ?? 0;
  connectionCounts.set(userId, previousCount + 1);
  return previousCount === 0;
}

export function disconnectUser(userId: string) {
  const previousCount = connectionCounts.get(userId) ?? 0;

  if (previousCount <= 1) {
    connectionCounts.delete(userId);
    return previousCount > 0;
  }

  connectionCounts.set(userId, previousCount - 1);
  return false;
}

export function getOnlineUsers() {
  return Array.from(connectionCounts.keys());
}

export function getOnlineUserCount() {
  return connectionCounts.size;
}
