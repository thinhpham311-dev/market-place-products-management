import axios, { AxiosError } from "axios";
import { translateRuntime } from "@/lib/i18n/runtime-translation";

export interface NormalizedApiError {
  status: number;
  message: string;
  errors?: unknown;
  isAxiosError: boolean;
}

function normalizeErrorMessage(message: string | undefined, status?: number): string {
  if (
    !message ||
    message === "Unknown error" ||
    message.startsWith("Request failed with status code")
  ) {
    return (status ?? 500) >= 500
      ? translateRuntime("api_server_error")
      : translateRuntime("api_invalid_request");
  }

  return message;
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
  fallbackMessage = translateRuntime("common_something_went_wrong"),
): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return handleAxiosError(error).message || fallbackMessage;
}
