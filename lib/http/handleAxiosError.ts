import axios, { AxiosError } from "axios";
import { translateRuntime } from "@/lib/i18n/runtime-translation";

export interface NormalizedApiError {
  status: number;
  message: string;
  errors?: unknown;
  isAxiosError: boolean;
}

export function toUserFriendlyErrorMessage(
  rawMessage: string | undefined,
  status?: number,
): string {
  const trimmed = (rawMessage || "").trim();
  const lower = trimmed.toLowerCase();

  if (!trimmed) {
    return (status ?? 500) >= 500
      ? "Hệ thống đang tạm thời gián đoạn. Vui lòng thử lại sau ít phút."
      : "Thông tin yêu cầu chưa hợp lệ. Vui lòng kiểm tra và thử lại.";
  }

  // Network / connection errors
  if (
    lower.includes("econnrefused") ||
    lower.includes("network error") ||
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("econnreset") ||
    lower.includes("enotfound") ||
    lower.includes("socket hang up") ||
    lower.includes("err_network")
  ) {
    return "Không thể kết nối đến hệ thống. Vui lòng kiểm tra mạng hoặc thử lại sau ít phút.";
  }

  // Timeout errors
  if (
    lower.includes("timeout") ||
    lower.includes("etimedout") ||
    lower.includes("econnaborted")
  ) {
    return "Hệ thống phản hồi quá lâu. Vui lòng bấm thử lại.";
  }

  // Auth / token / session errors
  if (
    lower.includes("jwt") ||
    lower.includes("token") ||
    lower.includes("signature") ||
    lower.includes("keystore") ||
    lower.includes("unauthorized") ||
    lower.includes("unauthenticated") ||
    lower.includes("invalid user") ||
    lower.includes("not found user") ||
    lower.includes("auth failure") ||
    lower.includes("forbidden") ||
    lower.includes("access denied") ||
    status === 401 ||
    status === 403
  ) {
    return "Phiên làm việc đã hết hạn hoặc chưa được xác thực. Vui lòng đăng nhập lại hoặc thử lại.";
  }

  // Rate limit
  if (
    status === 429 ||
    lower.includes("too many requests") ||
    lower.includes("rate limit")
  ) {
    return "Bạn đang thao tác quá nhanh. Vui lòng đợi giây lát rồi thử lại.";
  }

  // Code / runtime / database / internal server errors
  if (
    lower.includes("unknown error") ||
    lower.startsWith("request failed with status code") ||
    lower.includes("internal server error") ||
    lower.includes("server error") ||
    lower.includes("something went wrong") ||
    lower.includes("có lỗi hệ thống") ||
    lower.includes("đã xảy ra lỗi") ||
    lower.includes("server misconfiguration") ||
    lower.includes("bad gateway") ||
    lower.includes("service unavailable") ||
    lower.includes("gateway timeout") ||
    lower.includes("objectid") ||
    lower.includes("cast to") ||
    lower.includes("mongo") ||
    lower.includes("e11000") ||
    lower.includes("duplicate key") ||
    lower.includes("typeerror") ||
    lower.includes("referenceerror") ||
    lower.includes("syntaxerror") ||
    lower.includes("cannot read prop") ||
    lower.includes("is not a function") ||
    lower.includes("invalid request")
  ) {
    return (status ?? 500) >= 500
      ? "Hệ thống đang bận hoặc bảo trì tạm thời. Vui lòng thử lại sau ít phút."
      : "Không thể xử lý yêu cầu lúc này. Vui lòng kiểm tra lại thông tin và thử lại.";
  }

  // If status >= 500 and message looks like raw English/technical text (no Vietnamese diacritics)
  const hasVietnameseChars =
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
      trimmed,
    );
  if ((status ?? 0) >= 500 && !hasVietnameseChars) {
    return "Hệ thống đang tạm thời gián đoạn, chưa thể tải dữ liệu lúc này. Vui lòng thử lại sau ít phút.";
  }

  return trimmed;
}

function normalizeErrorMessage(message: string | undefined, status?: number): string {
  return toUserFriendlyErrorMessage(message, status);
}

export function handleAxiosError(error: unknown): NormalizedApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    const status = axiosError.response?.status || 500;

    return {
      status,
      message: normalizeErrorMessage(
        axiosError.response?.data?.message || axiosError.message,
        status,
      ),
      errors: axiosError.response?.data?.errors,
      isAxiosError: true,
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      message: normalizeErrorMessage(error.message, 500),
      isAxiosError: false,
    };
  }

  return {
    status: 500,
    message: translateRuntime("api_server_error"),
    isAxiosError: false,
  };
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = "Hệ thống đang tạm thời gián đoạn. Vui lòng thử lại sau ít phút.",
): string {
  if (typeof error === "string" && error.trim()) {
    return toUserFriendlyErrorMessage(error, 500);
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    const status = (error as { status?: number })?.status ?? 500;

    if (typeof message === "string" && message.trim()) {
      return toUserFriendlyErrorMessage(message, status);
    }
  }

  return handleAxiosError(error).message || fallbackMessage;
}
