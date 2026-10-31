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

function didUpstreamUnpublishSucceed(data: any): boolean {
  if (!data || typeof data !== "object") return true;
  if (data.status === "error") return false;
  const code = Number(data.code ?? data.statusCode ?? 0);
  if (code >= 400) return false;

  if ("metadata" in data || "data" in data || "result" in data) {
    const meta = data.metadata ?? data.data ?? data.result;
    if (meta === null || meta === 0 || meta === false) {
      return false;
    }
    if (meta && typeof meta === "object") {
      if (meta.modifiedCount === 0 && meta.matchedCount === 0) {
        return false;
      }
      if (meta.nModified === 0 && meta.n === 0) {
        return false;
      }
    }
  }
  return true;
}

type RouteParamsContext = {
  params: Promise<{ product_id: string }>;
};

export async function GET(
  req: Request,
  context: RouteParamsContext,
): Promise<Response> {
  const { product_id } = await context.params;
  const headers = buildUpstreamHeaders(req);

  return NextResponse.json({
    endpoint: `/api/product/spu/unpublish/${product_id}`,
    methods: ["POST", "PATCH", "PUT"],
    upstream: `${API_NEXT}/v1/api/product/spu/unpublish/${product_id}`,
    headers,
  });
}

async function handleUnpublishProductSpu(
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

    const { product_id } = await context.params;
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const headers = buildUpstreamHeaders(req);

    const {
      fallback_id: fallbackIdFromBody,
      ...restBody
    } = body as Record<string, unknown> & { fallback_id?: string };

    const candidateIds = Array.from(
      new Set(
        [
          product_id,
          typeof restBody.product_id === "string" ||
          typeof restBody.product_id === "number"
            ? String(restBody.product_id)
            : undefined,
          fallbackIdFromBody && !String(fallbackIdFromBody).startsWith("SPU-")
            ? String(fallbackIdFromBody)
            : undefined,
          typeof restBody.spu_id === "string" ||
          typeof restBody.spu_id === "number"
            ? String(restBody.spu_id)
            : undefined,
          typeof restBody._id === "string" ? restBody._id : undefined,
        ]
          .filter((val): val is string => Boolean(val && String(val).trim()))
          .map((val) => String(val).trim()),
      ),
    );

    if (candidateIds.length === 0) {
      return NextResponse.json(
        { message: "Missing product_id parameter" },
        { status: 400 },
      );
    }

    const incomingMethod = req.method.toUpperCase();
    const methodOrder: Array<"post" | "patch" | "put"> =
      incomingMethod === "PATCH"
        ? ["patch", "post", "put"]
        : incomingMethod === "PUT"
          ? ["put", "post", "patch"]
          : ["post", "patch", "put"];

    let firstStructuredError: unknown = null;
    let lastError: unknown = null;
    let lastFallbackSuccessResponse: unknown = null;

    for (const targetId of candidateIds) {
      const upstreamUrl = `${API_NEXT}/v1/api/product/spu/unpublish/${encodeURIComponent(
        targetId,
      )}`;

      for (const method of methodOrder) {
        try {
          const { data: dataResponse } = await axios({
            url: upstreamUrl,
            method,
            params: { product_id: targetId },
            data: {
              ...restBody,
              product_id: targetId,
              _id: targetId,
            },
            headers,
          });

          if (didUpstreamUnpublishSucceed(dataResponse)) {
            return NextResponse.json(dataResponse);
          }

          lastFallbackSuccessResponse = dataResponse;
          // Try next candidateId if this ID matched 0 documents
          break;
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

          if (status === 404 || status === 405) {
            continue;
          }

          // Break method loop to try next candidateId (e.g., _id vs product_id)
          break;
        }
      }
    }

    if (lastFallbackSuccessResponse) {
      return NextResponse.json(lastFallbackSuccessResponse);
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

export async function POST(
  req: Request,
  context: RouteParamsContext,
): Promise<Response> {
  return handleUnpublishProductSpu(req, context);
}

export async function PATCH(
  req: Request,
  context: RouteParamsContext,
): Promise<Response> {
  return handleUnpublishProductSpu(req, context);
}

export async function PUT(
  req: Request,
  context: RouteParamsContext,
): Promise<Response> {
  return handleUnpublishProductSpu(req, context);
}
