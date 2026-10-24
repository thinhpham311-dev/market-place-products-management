import ApiService from "./ApiService";
import { IUser } from "@/interfaces/user";
import {
  NEXT_PUBLIC_API_KEY,
  REQUEST_HEADER_API_KEY,
  REQUEST_HEADER_CLIENT_ID,
  REQUEST_HEADER_REFRESH_TOKEN,
} from "@/constants/api/api.constant";

export const NEXT_SIGNIN_API_ENDPOINT = "/api/shop/signin";
export const NEXT_SIGNOUT_API_ENDPOINT = "/api/shop/signout";
export const NEXT_REFRESH_TOKEN_API_ENDPOINT = "/api/shop/refreshtoken";

export async function apiSignIn(data: IUser) {
  return ApiService.fetchData({
    url: "/shop/signin",
    method: "post",
    data,
    headers: {
      [REQUEST_HEADER_API_KEY]:
        process.env.NEXT_PUBLIC_API_KEY || NEXT_PUBLIC_API_KEY,
    },
  });
}

export async function apiRefreshToken(data?: {
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
}) {
  const headers: Record<string, string> = {
    [REQUEST_HEADER_API_KEY]:
      process.env.NEXT_PUBLIC_API_KEY || NEXT_PUBLIC_API_KEY,
  };

  if (data?.accessToken) {
    headers["authorization"] = data.accessToken;
  }

  if (data?.refreshToken || data?.accessToken) {
    headers[REQUEST_HEADER_REFRESH_TOKEN] =
      data.refreshToken || data.accessToken || "";
  }

  if (data?.clientId) {
    headers[REQUEST_HEADER_CLIENT_ID] = data.clientId;
  }

  return ApiService.fetchData({
    url: "/shop/refreshtoken",
    method: "post",
    data: data || {},
    headers,
  });
}

export async function apiSignUp(data: IUser) {
  return ApiService.fetchData({
    url: "/sign-up",
    method: "post",
    data,
  });
}

export async function apiSignOut(data?: IUser) {
  return ApiService.fetchData({
    url: "/shop/signout",
    method: "post",
    data: data || {},
    headers: {
      [REQUEST_HEADER_API_KEY]:
        process.env.NEXT_PUBLIC_API_KEY || NEXT_PUBLIC_API_KEY,
    },
  });
}

export async function apiForgotPassword(data: IUser) {
  return ApiService.fetchData({
    url: "/forgot-password",
    method: "post",
    data,
  });
}

export async function apiResetPassword(data: IUser) {
  return ApiService.fetchData({
    url: "/reset-password",
    method: "post",
    data,
  });
}
