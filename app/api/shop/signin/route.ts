import axios from "axios";
import { NextResponse } from "next/server";
import { handleAxiosError } from "@/lib/http/handleAxiosError";
import {
  NEXT_PUBLIC_API_KEY,
  REQUEST_HEADER_API_KEY,
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
    endpoint: "/api/shop/signin",
    method: "POST",
    upstream: `${API_NEXT}/v1/api/shop/signin`,
    headers: {
      "Content-Type": "application/json",
      [REQUEST_HEADER_API_KEY]: apiKey,
    },
  });
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();

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

    const { data: dataResponse } = await axios.post(
      `${API_NEXT}/v1/api/shop/signin`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          [REQUEST_HEADER_API_KEY]: apiKey,
        },
      },
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
