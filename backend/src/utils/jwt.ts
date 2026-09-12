import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AccessTokenPayload {
  userId: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: "15m",
  });
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: "7d",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(
    token,
    env.jwtAccessSecret
  ) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(
    token,
    env.jwtRefreshSecret
  ) as RefreshTokenPayload;
}