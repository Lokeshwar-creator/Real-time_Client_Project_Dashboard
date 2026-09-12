import axios from "axios";

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL,

  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * ---------------------------------------------------------
 * ACCESS TOKEN
 * ---------------------------------------------------------
 *
 * The access token is kept in memory.
 *
 * We intentionally do NOT store it in localStorage.
 */

let accessToken: string | null = null;

export function setAccessToken(
  token: string | null
) {
  accessToken = token;
}

/**
 * ---------------------------------------------------------
 * REQUEST INTERCEPTOR
 * ---------------------------------------------------------
 *
 * Automatically attach:
 *
 * Authorization: Bearer <accessToken>
 *
 * to every protected API request.
 */

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  }
);

export default api;