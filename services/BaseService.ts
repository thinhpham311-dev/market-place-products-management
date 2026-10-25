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
import {
  addApiError,
  removeApiError,
  showErrorToast,
} from "@/store/slices/uiSlice";
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

function normalizeEndpointPath(reqUrl: string): string {
  const cleanUrl = reqUrl.split("?")[0] || "/api";
  return cleanUrl.startsWith("/api")
    ? cleanUrl
    : `/api${cleanUrl.startsWith("/") ? "" : "/"}${cleanUrl}`;
}

export function resolveApiEndpointLabel(endpoint: string): string {
  if (endpoint.includes("/product/spu/published/list")) {
    return "Danh sách sản phẩm đang bán";
  }
  if (endpoint.includes("/product/spu/drafted/list")) {
    return "Danh sách sản phẩm nháp";
  }
  if (endpoint.includes("/category/all/list")) {
    return "Danh sách danh mục";
  }
  if (endpoint.includes("/product/spu/create")) {
    return "Tạo sản phẩm SPU";
  }
  if (endpoint.includes("/product/spu/publish")) {
    return "Xuất bản sản phẩm SPU";
  }
  if (endpoint.includes("/category/create")) {
    return "Tạo danh mục";
  }
  if (endpoint.includes("/category/delete")) {
    return "Xóa danh mục";
  }
  if (endpoint.includes("/category/update") || endpoint.includes("/category/status")) {
    return "Cập nhật danh mục";
  }
  if (endpoint.includes("/shop/refreshtoken")) {
    return "Làm mới phiên đăng nhập";
  }
  return endpoint;
}

function notifyServerError(
  normalized: { status: number; message: string },
  reqUrl: string,
) {
  if (
    normalized.status >= 500 &&
    !reqUrl.includes("/shop/signin") &&
    !reqUrl.includes("/shop/signout")
  ) {
    const endpoint = normalizeEndpointPath(reqUrl);
    const label = resolveApiEndpointLabel(endpoint);
    store.dispatch(
      addApiError({
        id: endpoint,
        endpoint,
        label,
        status: normalized.status,
        message: normalized.message,
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      }),
    );
    store.dispatch(
      showErrorToast(normalized.message),
    );
  }
}

BaseService.interceptors.response.use(
  (response) => {
    const reqUrl = String(response?.config?.url || "");
    const endpoint = normalizeEndpointPath(reqUrl);
    const data = response?.data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const payloadCode = Number(
        data.code ??
          data.statusCode ??
          (typeof data.status === "number" ? data.status : 0),
      );
      if (
        payloadCode >= 500 ||
        (data.status === "error" && (!payloadCode || payloadCode >= 500))
      ) {
        const status = payloadCode >= 500 ? payloadCode : 500;
        const msg =
          typeof data.message === "string" && data.message.trim()
            ? data.message.trim()
            : handleAxiosError(new Error("Internal Server Error")).message;
        const normalized = {
          status,
          message: msg,
          errors: data.errors,
          isAxiosError: true,
        };
        notifyServerError(normalized, reqUrl);
        return Promise.reject(normalized);
      }
    }

    const existingErrors = store.getState()?.ui?.apiErrors;
    if (
      Array.isArray(existingErrors) &&
      existingErrors.some((e) => e.endpoint === endpoint)
    ) {
      store.dispatch(removeApiError(endpoint));
    }

    return response;
  },
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
        const normalizedRefreshErr = handleAxiosError(refreshError);
        notifyServerError(normalizedRefreshErr, reqUrl);
        return Promise.reject(normalizedRefreshErr);
      }
    }

    const normalized = handleAxiosError(error);
    notifyServerError(normalized, reqUrl);
    return Promise.reject(normalized);
  },
);

export default BaseService;
