import crypto from "crypto";
import { Request, Response } from "express";
import { prisma } from "../../config/database";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { comparePassword } from "../../utils/password";
import { hashToken } from "../../utils/token.hash";

export async function revokeRefreshToken(
  refreshToken: string
) {
  try {
    const payload =
      verifyRefreshToken(refreshToken);

    const tokenHash =
      hashToken(refreshToken);

    await prisma.refreshToken.updateMany({
      where: {
        userId: payload.userId,
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  } catch {
    // Token is already invalid/expired.
    // Logout should still succeed.
  }
}
export async function refreshUserSession(
  refreshToken: string
) {
  const payload = verifyRefreshToken(refreshToken);

  const tokenHash = hashToken(refreshToken);

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      userId: payload.userId,
      tokenHash,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: true,
    },
  });

  if (!storedToken) {
    throw new Error("Invalid or expired refresh token");
  }

  const newRefreshToken = generateRefreshToken({
    userId: storedToken.userId,
  });

  const newRefreshTokenHash =
    hashToken(newRefreshToken);

  const newExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    }),

    prisma.refreshToken.create({
      data: {
        userId: storedToken.userId,
        tokenHash: newRefreshTokenHash,
        expiresAt: newExpiresAt,
      },
    }),
  ]);

  const accessToken = generateAccessToken({
    userId: storedToken.user.id,
    role: storedToken.user.role,
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: {
      id: storedToken.user.id,
      name: storedToken.user.name,
      email: storedToken.user.email,
      role: storedToken.user.role,
    },
  };
}

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

  const tokenHash = hashToken(refreshToken);

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


export async function logoutController(
  req: Request,
  res: Response
) {
  const refreshToken =
    req.cookies?.refreshToken;

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}