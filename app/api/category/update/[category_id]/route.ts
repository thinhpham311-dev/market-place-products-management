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
    endpoint: `/api/category/update/${category_id}`,
    methods: ["PATCH", "POST", "PUT"],
    upstream: `${API_NEXT}/v1/api/category/update/${category_id}`,
    headers,
  });
}

async function handleUpdateCategory(
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
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const headers = buildUpstreamHeaders(req);

    // Strip internal helper keys if present so upstream receives clean update fields
    const {
      fallback_id: fallbackIdFromBody,
      ...restBody
    } = body as Record<string, unknown> & { fallback_id?: string };

    const upstreamPayload: Record<string, unknown> = {
      ...restBody,
    };

    if (restBody.category_active !== undefined) {
      upstreamPayload.category_active = Boolean(restBody.category_active);
    }

    const candidateIds = Array.from(
      new Set(
        [
          category_id,
          fallbackIdFromBody,
          typeof restBody.category_id === "string" ||
          typeof restBody.category_id === "number"
            ? String(restBody.category_id)
            : undefined,
          typeof restBody.id === "string" || typeof restBody.id === "number"
            ? String(restBody.id)
            : undefined,
          typeof restBody._id === "string" ? restBody._id : undefined,
        ]
          .filter((val): val is string => Boolean(val && String(val).trim()))
          .map((val) => String(val).trim()),
      ),
    );

    if (candidateIds.length === 0) {
      return NextResponse.json(
        { message: "Missing category_id parameter" },
        { status: 400 },
      );
    }

    const incomingMethod = req.method.toUpperCase();
    const methodOrder: Array<"patch" | "post" | "put"> =
      incomingMethod === "POST"
        ? ["post", "patch", "put"]
        : incomingMethod === "PUT"
          ? ["put", "patch", "post"]
          : ["patch", "post", "put"];

    let firstStructuredError: unknown = null;
    let lastError: unknown = null;

    for (const targetId of candidateIds) {
      const upstreamUrl = `${API_NEXT}/v1/api/category/update/${encodeURIComponent(
        targetId,
      )}`;

      for (const method of methodOrder) {
        try {
          const { data: dataResponse } = await axios({
            url: upstreamUrl,
            method,
            data: upstreamPayload,
            headers,
          });
          return NextResponse.json(dataResponse);
        } catch (err: unknown) {
          lastError = err;
          const resp = (
            err as {
              response?: { status?: number; data?: unknown };
            }
          )?.response;
          const status = resp?.status;

          if (
            resp?.data &&
            typeof resp.data === "object" &&
            !firstStructuredError
          ) {
            firstStructuredError = err;
          }

          // If method is not allowed or route method mismatch (404/405), try next method
          if (status === 404 || status === 405) {
            continue;
          }

          // For other status codes (e.g. 400, 401, 403, 500), break method loop
          break;
        }
      }
    }

    throw firstStructuredError || lastError;
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

export async function PATCH(
  req: Request,
  context: RouteParamsContext,
): Promise<Response> {
  return handleUpdateCategory(req, context);
}

export async function POST(
  req: Request,
  context: RouteParamsContext,
): Promise<Response> {
  return handleUpdateCategory(req, context);
}

export async function PUT(
  req: Request,
  context: RouteParamsContext,
): Promise<Response> {
  return handleUpdateCategory(req, context);
}
