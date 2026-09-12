import crypto from "crypto";
import { prisma } from "../../config/database";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { comparePassword } from "../../utils/password";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordMatches = await comparePassword(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
  });

  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);

  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      tokenHash,
    },
  });

  if (
    !storedToken ||
    storedToken.revokedAt ||
    storedToken.expiresAt < new Date()
  ) {
    throw new Error("Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
  });

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}