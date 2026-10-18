import ApiService from "./ApiService";
import { IUser } from "@/interfaces/user";
import {
  NEXT_PUBLIC_API_KEY,
  REQUEST_HEADER_API_KEY,
} from "@/constants/api/api.constant";

export const NEXT_SIGNIN_API_ENDPOINT = "/api/shop/signin";
export const NEXT_SIGNOUT_API_ENDPOINT = "/api/shop/signout";

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
