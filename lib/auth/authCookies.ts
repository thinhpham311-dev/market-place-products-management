import { NextResponse } from "next/server";
import {
  REQUEST_HEADER_AUTH_KEY,
  REQUEST_HEADER_CLIENT_ID,
  REQUEST_HEADER_REFRESH_TOKEN,
} from "@/constants/api/api.constant";

export const COOKIE_ACCESS_TOKEN = "accessToken";
export const COOKIE_REFRESH_TOKEN = "refreshToken";
export const COOKIE_CLIENT_ID = "clientId";

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
}

export function parseAuthCookies(req: Request): Record<string, string> {
  const cookieHeader = req.headers.get("cookie") || "";
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;

  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}

export function getAuthFromRequest(req: Request): {
  authorization: string;
  clientId: string;
  refreshToken: string;
} {
  const cookies = parseAuthCookies(req);
  const rawAuth =
    req.headers.get("authorization") ||
    req.headers.get(REQUEST_HEADER_AUTH_KEY) ||
    cookies.accessToken ||
    "";
  const authorization = rawAuth.replace(/^Bearer\s+/i, "").split(",")[0].trim();
  const headerClientId = req.headers.get(REQUEST_HEADER_CLIENT_ID) || "";
  const clientId = headerClientId || cookies.clientId || "";
  const refreshToken =
    req.headers.get(REQUEST_HEADER_REFRESH_TOKEN) ||
    cookies.refreshToken ||
    "";

  return { authorization, clientId, refreshToken };
}

export function setAuthCookies(
  res: NextResponse,
  tokens: AuthTokens,
  keepMeSignedIn = true,
): NextResponse {
  const isProd = process.env.NODE_ENV === "production";
  const maxAge = keepMeSignedIn ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

  if (tokens.accessToken) {
    res.cookies.set({
      name: COOKIE_ACCESS_TOKEN,
      value: tokens.accessToken.replace(/^Bearer\s+/i, "").trim(),
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge,
    });
  }

  if (tokens.refreshToken) {
    res.cookies.set({
      name: COOKIE_REFRESH_TOKEN,
      value: tokens.refreshToken.replace(/^Bearer\s+/i, "").trim(),
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge,
    });
  }

  if (tokens.clientId) {
    res.cookies.set({
      name: COOKIE_CLIENT_ID,
      value: tokens.clientId.trim(),
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge,
    });
  }

  return res;
}

export function clearAuthCookies(res: NextResponse): NextResponse {
  const isProd = process.env.NODE_ENV === "production";
  const clearOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  res.cookies.set({ name: COOKIE_ACCESS_TOKEN, value: "", ...clearOpts });
  res.cookies.set({ name: COOKIE_REFRESH_TOKEN, value: "", ...clearOpts });
  res.cookies.set({ name: COOKIE_CLIENT_ID, value: "", ...clearOpts });

  return res;
}
