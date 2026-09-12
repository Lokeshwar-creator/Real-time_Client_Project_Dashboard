import api from "./axios";

export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export async function login(email: string, password: string) {
  const response = await api.post("/auth/login", { email, password });
  return response.data.data as AuthResult;
}

export async function refreshAccessToken() {
  const response = await api.post("/auth/refresh");
  return response.data.data as AuthResult;
}

export async function logout() {
  await api.post("/auth/logout");
}
