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
      extractUserIdFromJwt(currentAccessToken) ||
      extractUserIdFromJwt(currentRefreshToken) ||
      state?.auth?.user?.id;

    try {
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || API_KEY;
      const payload: Record<string, unknown> = {
        ...(currentAccessToken ? { accessToken: currentAccessToken } : {}),
        ...(currentRefreshToken
          ? { refreshToken: currentRefreshToken }
          : currentAccessToken
            ? { refreshToken: currentAccessToken }
            : {}),
        ...(clientId ? { clientId } : {}),
      };

      const refreshHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(apiKey ? { [REQUEST_HEADER_API_KEY]: apiKey } : {}),
        ...(currentAccessToken ? { authorization: currentAccessToken } : {}),
        ...(currentRefreshToken
          ? { [REQUEST_HEADER_REFRESH_TOKEN]: currentRefreshToken }
          : currentAccessToken
            ? { [REQUEST_HEADER_REFRESH_TOKEN]: currentAccessToken }
            : {}),
        ...(clientId ? { [REQUEST_HEADER_CLIENT_ID]: clientId } : {}),
      };

      let refreshRes;
      try {
        refreshRes = await axios.post("/v1/api/shop/refreshtoken", payload, {
          headers: refreshHeaders,
          withCredentials: true,
        });
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          refreshRes = await axios.post(`${baseURL}/shop/refreshtoken`, payload, {
            headers: refreshHeaders,
            withCredentials: true,
          });
        } else {
          throw err;
        }
      }

      const refreshData = refreshRes.data;
      const metadata =
        refreshData?.metadata || refreshData?.data || refreshData;
      const newAccessToken =
        metadata?.tokens?.accessToken ||
        metadata?.accessToken ||
        metadata?.token ||
        refreshData?.tokens?.accessToken ||
        refreshData?.accessToken ||
        refreshData?.token;
      const newRefreshToken =
        metadata?.tokens?.refreshToken ||
        metadata?.refreshToken ||
        refreshData?.tokens?.refreshToken ||
        refreshData?.refreshToken;

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
    let jsonPayload = "";
    if (typeof atob === "function") {
      jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
    } else {
      const g = globalThis as {
        Buffer?: {
          from: (str: string, enc: string) => { toString: (enc: string) => string };
        };
      };
      if (g.Buffer) {
        jsonPayload = g.Buffer.from(base64, "base64").toString("utf-8");
      }
    }
    if (!jsonPayload) return null;
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

    if (refreshToken || (reqUrl.includes("/shop/refreshtoken") && accessToken)) {
      config.headers[REQUEST_HEADER_REFRESH_TOKEN] =
        refreshToken || accessToken;
    }

    const storedClientId = state?.auth?.user?.id;
    const jwtClientId = extractUserIdFromJwt(accessToken);
    const clientId =
      jwtClientId ||
      storedClientId ||
      "66f1a2b3c4d5e6f7a8b9c0d1";

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
  if (endpoint.includes("/product/spu/update")) {
    return "Cập nhật sản phẩm SPU";
  }
  if (endpoint.includes("/product/spu/unpublish")) {
    return "Hủy xuất bản sản phẩm SPU";
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
        payloadCode === 401 ||
        (typeof data.message === "string" &&
          (data.message.toLowerCase().includes("jwt expired") ||
            data.message.toLowerCase().includes("token expired")))
      ) {
        const authErr = new Error(data.message || "Token expired");
        (authErr as unknown as { response: unknown; config: unknown }).response = response;
        (authErr as unknown as { response: unknown; config: unknown }).config = response.config;
        return Promise.reject(authErr);
      }

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
      reqUrl.includes("/shop/refreshtoken") ||
      reqUrl.includes("/refreshtoken");

    const statusCode =
      response?.status ||
      (typeof response?.data?.code === "number" ? response.data.code : 0) ||
      (typeof response?.data?.statusCode === "number" ? response.data.statusCode : 0);

    const errorMessage = String(
      response?.data?.message || error?.message || "",
    ).toLowerCase();
    const isTokenExpiredError =
      (response && unauthorizedCode.includes(response.status)) ||
      statusCode === 401 ||
      (statusCode === 403 &&
        (errorMessage.includes("expired") ||
          errorMessage.includes("jwt") ||
          errorMessage.includes("token") ||
          errorMessage.includes("auth"))) ||
      errorMessage.includes("jwt expired") ||
      errorMessage.includes("token expired") ||
      errorMessage.includes("expired") ||
      errorMessage.includes("jwt");

    const state = store.getState();
    const isSignedIn = state?.auth?.session?.signedIn;
    const keepMeSignedIn = state?.auth?.session?.keepMeSignedIn ?? true;
    const currentAccessToken = state?.auth?.session?.token;
    const currentRefreshToken = state?.auth?.session?.refreshToken;
    const hasAnyToken = Boolean(currentAccessToken || currentRefreshToken);

    if (
      isTokenExpiredError &&
      (isSignedIn || hasAnyToken) &&
      !isAuthExcluded &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessTokenSingleFlight();
        if (newAccessToken) {
          if (!originalRequest.headers) {
            originalRequest.headers = {} as AxiosRequestConfig["headers"];
          }
          const headersAny = originalRequest.headers as unknown as {
            set?: (key: string, val: string) => void;
            [key: string]: unknown;
          };
          if (typeof headersAny.set === "function") {
            headersAny.set(REQUEST_HEADER_AUTH_KEY, `${TOKEN_TYPE}${newAccessToken}`);
            headersAny.set("authorization", newAccessToken);
          } else {
            headersAny[REQUEST_HEADER_AUTH_KEY] = `${TOKEN_TYPE}${newAccessToken}`;
            headersAny["authorization"] = newAccessToken;
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
