import axios from "axios";
import { NextResponse } from "next/server";
import { handleAxiosError } from "@/lib/http/handleAxiosError";
import {
  parseAuthCookies,
  clearAuthCookies,
} from "@/lib/auth/authCookies";
import {
  NEXT_PUBLIC_API_KEY,
  REQUEST_HEADER_API_KEY,
  REQUEST_HEADER_AUTH_KEY,
  REQUEST_HEADER_CLIENT_ID,
} from "@/constants/api/api.constant";

const API_NEXT =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.API_URL ||
  "http://localhost:3055";

export async function GET(req: Request): Promise<Response> {
  const apiKey =
    process.env.NEXT_PUBLIC_API_KEY ||
    req.headers.get(REQUEST_HEADER_API_KEY) ||
    NEXT_PUBLIC_API_KEY;

  return NextResponse.json({
    endpoint: "/api/shop/signout",
    method: "POST",
    upstream: `${API_NEXT}/v1/api/shop/signout`,
    headers: {
      "Content-Type": "application/json",
      [REQUEST_HEADER_API_KEY]: apiKey,
    },
  });
}

export async function POST(req: Request): Promise<Response> {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    if (!API_NEXT) {
      return NextResponse.json(
        { message: "Server misconfiguration: NEXT_PUBLIC_API_URL not set" },
        { status: 500 },
      );
    }

    const apiKey =
      process.env.NEXT_PUBLIC_API_KEY ||
      req.headers.get(REQUEST_HEADER_API_KEY) ||
      NEXT_PUBLIC_API_KEY;

    const cookies = parseAuthCookies(req);

    const authorization =
      req.headers.get("authorization") ||
      req.headers.get(REQUEST_HEADER_AUTH_KEY) ||
      cookies.accessToken ||
      "";

    const clientId =
      req.headers.get(REQUEST_HEADER_CLIENT_ID) ||
      (typeof body?.id === "string" ? body.id : "") ||
      cookies.clientId ||
      "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      [REQUEST_HEADER_API_KEY]: apiKey,
    };

    if (authorization) {
      headers["authorization"] = authorization;
    }

    if (clientId) {
      headers[REQUEST_HEADER_CLIENT_ID] = clientId;
    }

    let dataResponse: unknown = { message: "Signed out successfully" };
    try {
      const res = await axios.post(
        `${API_NEXT}/v1/api/shop/signout`,
        body,
        { headers },
      );
      dataResponse = res.data;
    } catch {
      // Proceed even if upstream returns error
    }

    const response = NextResponse.json(dataResponse);
    clearAuthCookies(response);
    return response;
  } catch (error: unknown) {
    const normalized = handleAxiosError(error);

    const errorResponse = NextResponse.json(
      {
        message: normalized.message,
        errors: normalized.errors,
      },
      { status: normalized.status },
    );
    clearAuthCookies(errorResponse);
    return errorResponse;
  }
}
