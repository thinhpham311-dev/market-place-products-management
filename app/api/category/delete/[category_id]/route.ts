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

type RouteParamsContext = {
  params: Promise<{ category_id: string }>;
};

export async function GET(
  req: Request,
  context: RouteParamsContext,
): Promise<Response> {
  const { category_id } = await context.params;
  const headers = buildUpstreamHeaders(req);

  return NextResponse.json({
    endpoint: `/api/category/delete/${category_id}`,
    method: "DELETE",
    upstream: `${API_NEXT}/v1/api/category/delete/${category_id}`,
    headers,
  });
}

async function executeCategoryDelete(
  req: Request,
  context: RouteParamsContext,
): Promise<Response> {
  try {
    if (!API_NEXT) {
      return NextResponse.json(
        { message: "Server misconfiguration: NEXT_PUBLIC_API_URL not set" },
        { status: 500 },
      );
    }

    const { category_id } = await context.params;
    const { searchParams } = new URL(req.url);

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const fallbackId =
      (body?.fallback_id as string | undefined) ||
      (body?.categoryId as string | undefined) ||
      searchParams.get("fallback_id") ||
      searchParams.get("categoryId") ||
      undefined;

    // Prioritize fallbackId (e.g. numeric category_id) then URL category_id
    const rawCandidates = [fallbackId, category_id, body?.id as string | undefined];
    const candidateIds = Array.from(
      new Set(
        rawCandidates
          .filter((id): id is string => Boolean(id && String(id).trim()))
          .map((id) => String(id).trim()),
      ),
    );

    if (candidateIds.length === 0) {
      return NextResponse.json(
        { message: "Missing category_id parameter" },
        { status: 400 },
      );
    }

    const headers = buildUpstreamHeaders(req);
    let lastError: unknown = null;
    let fallbackSuccessResponse: unknown = null;

    for (const targetId of candidateIds) {
      const upstreamUrl = `${API_NEXT}/v1/api/category/delete/${encodeURIComponent(targetId)}`;

      try {
        // Strictly execute HTTP DELETE request against upstream
        const { data } = await axios.delete(upstreamUrl, {
          headers,
        });

        const meta = (data as Record<string, unknown>)?.metadata;
        // If document was found and updated in MongoDB, metadata contains the updated doc
        if (meta !== null && meta !== undefined) {
          return NextResponse.json(data);
        }

        // Keep as candidate response if metadata is null, continue to next candidate ID
        if (!fallbackSuccessResponse) {
          fallbackSuccessResponse = data;
        }
      } catch (err: unknown) {
        lastError = err;
      }
    }

    if (fallbackSuccessResponse) {
      return NextResponse.json(fallbackSuccessResponse);
    }

    throw lastError || new Error("Failed to delete category on upstream server via DELETE method");
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

export async function DELETE(
  req: Request,
  context: RouteParamsContext,
): Promise<Response> {
  return executeCategoryDelete(req, context);
}
