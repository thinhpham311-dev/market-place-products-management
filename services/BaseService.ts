import axios, { AxiosRequestConfig } from "axios";
import appConfig from "@/configs/app.config";
import {
  TOKEN_TYPE,
  REQUEST_HEADER_AUTH_KEY,
  REQUEST_HEADER_API_KEY,
  REQUEST_HEADER_CLIENT_ID,
  REQUEST_HEADER_REFRESH_TOKEN,
  API_KEY,
} from "@/constants/api/api.constant";
import store from "@/store";
import {
  onSignOutSuccess,
  setRefreshToken,
  setToken,
} from "@/store/auth/sessionSlice";
import { userLoggedOut } from "@/store/auth/userSlice";
import { handleAxiosError } from "@/lib/http/handleAxiosError";

const unauthorizedCode = [401];
const baseURL = `${appConfig.apiPrefix}`;

const BaseService = axios.create({
  timeout: 60000,
  baseURL,
  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessTokenSingleFlight(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const state = store.getState();
    const currentAccessToken = state?.auth?.session?.token;
    const currentRefreshToken = state?.auth?.session?.refreshToken;
    const clientId =
      extractUserIdFromJwt(currentAccessToken) || state?.auth?.user?.id;

    if (!currentAccessToken && !currentRefreshToken) {
      return null;
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || API_KEY;
      const refreshRes = await axios.post(
        `${baseURL}/shop/refreshtoken`,
        {
          accessToken: currentAccessToken,
          refreshToken: currentRefreshToken || currentAccessToken,
          clientId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            [REQUEST_HEADER_API_KEY]: apiKey,
            ...(currentAccessToken
              ? { authorization: currentAccessToken }
              : {}),
            [REQUEST_HEADER_REFRESH_TOKEN]:
              currentRefreshToken || currentAccessToken || "",
            ...(clientId ? { [REQUEST_HEADER_CLIENT_ID]: clientId } : {}),
          },
          withCredentials: true,
        },
      );

      const refreshData = refreshRes.data;
      const metadata =
        refreshData?.metadata || refreshData?.data || refreshData;
      const newAccessToken =
        metadata?.tokens?.accessToken ||
        metadata?.accessToken ||
        metadata?.token;
      const newRefreshToken =
        metadata?.tokens?.refreshToken || metadata?.refreshToken;

      if (newAccessToken) {
        store.dispatch(setToken(newAccessToken));
        if (newRefreshToken) {
          store.dispatch(setRefreshToken(newRefreshToken));
        }
        return newAccessToken as string;
      }
      return null;
    } catch (refreshError) {
      const latestToken = store.getState()?.auth?.session?.token;
      if (latestToken && latestToken !== currentAccessToken) {
        return latestToken;
      }
      throw refreshError;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function extractUserIdFromJwt(token?: string): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const parsed = JSON.parse(jsonPayload) as Record<string, unknown>;
    const id = parsed.userId || parsed._id || parsed.id || parsed.sub;
    return typeof id === "string" && id ? id : null;
  } catch {
    return null;
  }
}

BaseService.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const accessToken = state?.auth?.session?.token;
    const refreshToken = state?.auth?.session?.refreshToken;
    const reqUrl = String(config.url || "");

    if (accessToken) {
      config.headers["authorization"] = accessToken;
    }

    if (reqUrl.includes("/shop/refreshtoken") && (refreshToken || accessToken)) {
      config.headers[REQUEST_HEADER_REFRESH_TOKEN] =
        refreshToken || accessToken;
    }

    const storedClientId = state?.auth?.user?.id;
    const jwtClientId = extractUserIdFromJwt(accessToken);
    const clientId =
      jwtClientId ||
      (storedClientId && storedClientId !== "66f1a2b3c4d5e6f7a8b9c0d1"
        ? storedClientId
        : storedClientId);

    if (clientId) {
      config.headers[REQUEST_HEADER_CLIENT_ID] = clientId;
    }

    const apiKey = process.env.NEXT_PUBLIC_API_KEY || API_KEY;
    if (apiKey) {
      config.headers[REQUEST_HEADER_API_KEY] = apiKey;
    }

    config.withCredentials = true;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

BaseService.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    const originalRequest = config as AxiosRequestConfig & { _retry?: boolean };
    const reqUrl = String(originalRequest?.url || "");
    const isAuthExcluded =
      reqUrl.includes("/shop/signin") ||
      reqUrl.includes("/shop/signout") ||
      reqUrl.includes("/shop/refreshtoken");

    const errorMessage = String(
      response?.data?.message || error?.message || "",
    ).toLowerCase();
    const isTokenExpiredError =
      (response && unauthorizedCode.includes(response.status)) ||
      errorMessage.includes("expired") ||
      errorMessage.includes("jwt");

    const state = store.getState();
    const isSignedIn = state?.auth?.session?.signedIn;
    const keepMeSignedIn = state?.auth?.session?.keepMeSignedIn ?? true;
    const currentAccessToken = state?.auth?.session?.token;

    if (
      isTokenExpiredError &&
      isSignedIn &&
      currentAccessToken &&
      !isAuthExcluded &&
      originalRequest &&
      !originalRequest._retry
    ) {
      if (keepMeSignedIn === false) {
        store.dispatch(onSignOutSuccess());
        store.dispatch(userLoggedOut());
        return Promise.reject(handleAxiosError(error));
      }

      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessTokenSingleFlight();
        if (newAccessToken) {
          if (originalRequest.headers) {
            originalRequest.headers[REQUEST_HEADER_AUTH_KEY] =
              `${TOKEN_TYPE}${newAccessToken}`;
            originalRequest.headers["authorization"] = newAccessToken;
          }
          return BaseService(originalRequest);
        }
      } catch (refreshError) {
        const refreshStatus = (
          refreshError as { response?: { status?: number } }
        )?.response?.status;
        if (refreshStatus === 401 || refreshStatus === 403) {
          store.dispatch(onSignOutSuccess());
          store.dispatch(userLoggedOut());
        }
        return Promise.reject(handleAxiosError(refreshError));
      }
    }

    return Promise.reject(handleAxiosError(error));
  },
);

export default BaseService;
