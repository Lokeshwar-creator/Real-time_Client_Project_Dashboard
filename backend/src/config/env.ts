import dotenv from "dotenv";

dotenv.config();

const requiredEnvVariables = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  port: Number(process.env.PORT) || 5000,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};