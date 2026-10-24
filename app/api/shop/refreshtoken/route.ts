import axios from "axios";
import { NextResponse } from "next/server";
import { handleAxiosError } from "@/lib/http/handleAxiosError";
import {
  NEXT_PUBLIC_API_KEY,
  REQUEST_HEADER_API_KEY,
  REQUEST_HEADER_AUTH_KEY,
  REQUEST_HEADER_CLIENT_ID,
  REQUEST_HEADER_REFRESH_TOKEN,
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
    endpoint: "/api/shop/refreshtoken",
    method: "POST",
    upstream: `${API_NEXT}/v1/api/shop/refreshtoken`,
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

    const rawAuthHeader =
      req.headers.get("authorization") ||
      req.headers.get(REQUEST_HEADER_AUTH_KEY) ||
      (typeof body?.accessToken === "string" ? body.accessToken : "") ||
      "";

    const cleanAccessToken = rawAuthHeader.replace(/^Bearer\s+/i, "");

    const refreshToken =
      req.headers.get(REQUEST_HEADER_REFRESH_TOKEN) ||
      (typeof body?.refreshToken === "string" ? body.refreshToken : "") ||
      cleanAccessToken;

    const clientId =
      req.headers.get(REQUEST_HEADER_CLIENT_ID) ||
      (typeof body?.clientId === "string" ? body.clientId : "") ||
      (typeof body?.id === "string" ? body.id : "") ||
      "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      [REQUEST_HEADER_API_KEY]: apiKey,
    };

    if (cleanAccessToken) {
      headers["authorization"] = cleanAccessToken;
    }

    if (refreshToken) {
      headers[REQUEST_HEADER_REFRESH_TOKEN] = refreshToken;
    }

    if (clientId) {
      headers[REQUEST_HEADER_CLIENT_ID] = clientId;
    }

    const { data: dataResponse } = await axios.post(
      `${API_NEXT}/v1/api/shop/refreshtoken`,
      {
        ...body,
        accessToken: cleanAccessToken || body?.accessToken,
        refreshToken: refreshToken || body?.refreshToken,
      },
      { headers },
    );

    return NextResponse.json(dataResponse);
  } catch (error: unknown) {
    const normalized = handleAxiosError(error);

    return NextResponse.json(
      {
        message: normalized.message,
        errors: normalized.errors,
      },
      { status: normalized.status },
    );
  }
}
