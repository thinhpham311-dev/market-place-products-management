import ApiService from "./ApiService";
import { IUser } from "@/interfaces/user";

export async function apiSignIn(data: IUser) {
  return ApiService.fetchData({
    url: "/sign-in",
    method: "post",
    data,
  });
}

export async function apiSignUp(data: IUser) {
  return ApiService.fetchData({
    url: "/sign-up",
    method: "post",
    data,
  });
}

export async function apiSignOut(data: IUser) {
  return ApiService.fetchData({
    url: "/sign-out",
    method: "post",
    data,
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
