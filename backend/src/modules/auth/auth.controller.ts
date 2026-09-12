import { Request, Response } from "express";
import {
  login,
  refreshUserSession,
  revokeRefreshToken,
} from "./auth.service";

export async function refreshController(
  req: Request,
  res: Response
) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const result = await refreshUserSession(refreshToken);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Invalid refresh token",
    });
  }
}

export async function loginController(
  req: Request,
  res: Response
) {
  try {
    const { email, password } = req.body;

    const result = await login(email, password);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Login failed",
    });
  }
}

export async function logoutController(
  req: Request,
  res: Response
) {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
}
