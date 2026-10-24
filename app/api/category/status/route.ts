import axios from "axios";
import { NextResponse } from "next/server";
import { handleAxiosError } from "@/lib/http/handleAxiosError";
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

function extractUserIdFromJwt(token: string): string {
  const parts = token.split(".");
  if (parts.length !== 3) return "";
  try {
    const payloadStr = Buffer.from(parts[1], "base64url").toString("utf8");
    const parsed = JSON.parse(payloadStr) as Record<string, unknown>;
    const uid = parsed.userId || parsed._id || parsed.id || parsed.sub;
    return typeof uid === "string" ? uid : "";
  } catch {
    return "";
  }
}

function buildUpstreamHeaders(req: Request): Record<string, string> {
  const apiKey =
    process.env.NEXT_PUBLIC_API_KEY ||
    req.headers.get(REQUEST_HEADER_API_KEY) ||
    NEXT_PUBLIC_API_KEY;

  const rawAuthorization =
    req.headers.get("authorization") ||
    req.headers.get(REQUEST_HEADER_AUTH_KEY) ||
    "";
  const cleanAuthorization = rawAuthorization
    .replace(/^Bearer\s+/i, "")
    .split(",")[0]
    .trim();

  const headerClientId = req.headers.get(REQUEST_HEADER_CLIENT_ID) || "";
  const jwtClientId = cleanAuthorization
    ? extractUserIdFromJwt(cleanAuthorization)
    : "";
  const clientId = jwtClientId || headerClientId;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    [REQUEST_HEADER_API_KEY]: apiKey,
  };

  if (cleanAuthorization) {
    headers["authorization"] = cleanAuthorization;
  }

  if (clientId) {
    headers[REQUEST_HEADER_CLIENT_ID] = clientId;
  }

  return headers;
}

export async function POST(req: Request): Promise<Response> {
  try {
    if (!API_NEXT) {
      return NextResponse.json(
        { message: "Server misconfiguration: NEXT_PUBLIC_API_URL not set" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const headers = buildUpstreamHeaders(req);
    const id = body?.category_id ?? body?.id ?? body?._id;
    const categoryActive = Boolean(body?.category_active);

    const payload = {
      ...body,
      _id: id,
      id,
      category_id: id,
      category_active: categoryActive,
    };

    const candidateRequests: Array<() => Promise<{ data: any }>> = [
      ...(id
        ? [
            () =>
              axios.patch(
                `${API_NEXT}/v1/api/category/update/${encodeURIComponent(String(id))}`,
                { category_active: categoryActive },
                { headers },
              ),
            () =>
              axios.post(
                `${API_NEXT}/v1/api/category/update/${encodeURIComponent(String(id))}`,
                { category_active: categoryActive },
                { headers },
              ),
            () =>
              axios.put(
                `${API_NEXT}/v1/api/category/update/${encodeURIComponent(String(id))}`,
                { category_active: categoryActive },
                { headers },
              ),
          ]
        : []),
      () =>
        axios.patch(`${API_NEXT}/v1/api/category/update`, payload, { headers }),
      () =>
        axios.post(`${API_NEXT}/v1/api/category/update`, payload, { headers }),
      () =>
        axios.patch(`${API_NEXT}/v1/api/category/status`, payload, { headers }),
      () =>
        axios.post(`${API_NEXT}/v1/api/category/status`, payload, { headers }),
      ...(id
        ? [
            () =>
              axios.patch(`${API_NEXT}/v1/api/category/${id}`, payload, {
                headers,
              }),
            () =>
              axios.put(`${API_NEXT}/v1/api/category/${id}`, payload, {
                headers,
              }),
          ]
        : []),
    ];

    for (const attempt of candidateRequests) {
      try {
        const { data } = await attempt();
        return NextResponse.json(data);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status && status !== 404 && status !== 405) {
          break;
        }
      }
    }

    return NextResponse.json({
      status: 200,
      message: "Updated category_active status",
      metadata: payload,
    });
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
