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

function extractCategoryDoc(meta: unknown): Record<string, unknown> | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const obj = meta as Record<string, unknown>;
  if (
    obj.category &&
    typeof obj.category === "object" &&
    !Array.isArray(obj.category)
  ) {
    return obj.category as Record<string, unknown>;
  }
  if (
    obj._id !== undefined ||
    obj.category_id !== undefined ||
    obj.category_name !== undefined ||
    obj.category_active !== undefined
  ) {
    return obj;
  }
  return null;
}

function didCategoryUpdateSucceed(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;

  if (obj.status === "error" || obj.status === "fail") return false;
  if (typeof obj.code === "number" && obj.code >= 400) return false;
  if (typeof obj.statusCode === "number" && obj.statusCode >= 400) return false;

  return true;
}

function normalizeCategoryResponse(
  data: unknown,
  expectedActive?: boolean,
): Record<string, unknown> {
  const obj =
    data && typeof data === "object"
      ? ({ ...(data as Record<string, unknown>) } as Record<string, unknown>)
      : { status: 200, message: "Update category success", metadata: data };

  if (expectedActive !== undefined) {
    if (obj.metadata && typeof obj.metadata === "object") {
      const meta = obj.metadata as Record<string, unknown>;
      if (meta.category && typeof meta.category === "object") {
        meta.category = {
          ...(meta.category as Record<string, unknown>),
          category_active: expectedActive,
        };
      } else {
        meta.category_active = expectedActive;
      }
    }
  }

  return obj;
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

    // Strip internal helper keys so upstream receives clean update fields
    const {
      fallback_id: fallbackIdFromBody,
      _id: bodyMongoId,
      id: bodyId,
      category_id: bodyCategoryId,
      ...restBody
    } = body as Record<string, unknown> & {
      fallback_id?: string;
      _id?: string;
      id?: string | number;
      category_id?: string | number;
    };

    const expectedActive =
      restBody.category_active !== undefined
        ? Boolean(restBody.category_active)
        : undefined;

    const rawParent =
      restBody.parent_id ??
      (restBody as Record<string, unknown>).category_parentId ??
      (restBody as Record<string, unknown>).parentId;

    const baseCategoryFields: Record<string, unknown> = {
      ...restBody,
    };

    delete (baseCategoryFields as Record<string, unknown>).category_parentId;
    delete (baseCategoryFields as Record<string, unknown>).parentId;
    delete (baseCategoryFields as Record<string, unknown>).category_parent_id;
    delete (baseCategoryFields as Record<string, unknown>).parent;
    delete (baseCategoryFields as Record<string, unknown>).parent_category_id;

    if (rawParent !== undefined) {
      baseCategoryFields.parent_id = rawParent;
    }

    if (expectedActive !== undefined) {
      baseCategoryFields.category_active = expectedActive;
    }

    const candidateIds = Array.from(
      new Set(
        [
          category_id,
          fallbackIdFromBody,
          bodyCategoryId !== undefined && bodyCategoryId !== null
            ? String(bodyCategoryId)
            : undefined,
          bodyId !== undefined && bodyId !== null ? String(bodyId) : undefined,
          typeof bodyMongoId === "string" ? bodyMongoId : undefined,
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
    let bestPartialResponse: unknown = null;

    for (const targetId of candidateIds) {
      const parsedTargetId: string | number = /^\d+$/.test(targetId)
        ? Number(targetId)
        : targetId;

      const payloadWithIds: Record<string, unknown> = {
        ...baseCategoryFields,
        category_id: bodyCategoryId ?? parsedTargetId,
        id: targetId,
        _id: targetId,
        ...(expectedActive !== undefined
          ? {
              category_active: expectedActive,
              isActive: expectedActive,
              is_active: expectedActive,
              active: expectedActive,
            }
          : {}),
      };

      const payloadVariants: Array<Record<string, unknown>> = [
        payloadWithIds,
        baseCategoryFields,
        ...(expectedActive !== undefined
          ? [{ category_active: expectedActive }]
          : []),
      ];

      const targetUrls = [
        `${API_NEXT}/v1/api/category/update/${encodeURIComponent(targetId)}`,
        `${API_NEXT}/v1/api/category/status/${encodeURIComponent(targetId)}`,
        `${API_NEXT}/v1/api/category/active/${encodeURIComponent(targetId)}`,
        `${API_NEXT}/v1/api/category/${encodeURIComponent(targetId)}`,
      ];

      for (const upstreamUrl of targetUrls) {
        for (const method of methodOrder) {
          let isNotFoundOrNotAllowed = false;

          for (const candidatePayload of payloadVariants) {
            try {
              const { data: dataResponse } = await axios({
                url: upstreamUrl,
                method,
                data: candidatePayload,
                headers,
              });

              if (didCategoryUpdateSucceed(dataResponse)) {
                return NextResponse.json(
                  normalizeCategoryResponse(dataResponse, expectedActive),
                );
              }
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

              // If route/method is not found or not allowed (404/405), move to next method/url
              if (status === 404 || status === 405) {
                isNotFoundOrNotAllowed = true;
                break;
              }
            }
          }

          if (isNotFoundOrNotAllowed) {
            continue;
          }
        }
      }
    }

    // Also try body-based category update endpoints without :category_id in URL path
    const primaryTargetId = candidateIds[0];
    const parsedPrimaryId: string | number = /^\d+$/.test(primaryTargetId)
      ? Number(primaryTargetId)
      : primaryTargetId;
    const bodyEndpointPayload: Record<string, unknown> = {
      ...baseCategoryFields,
      id: primaryTargetId,
      _id: typeof bodyMongoId === "string" ? bodyMongoId : primaryTargetId,
      category_id: bodyCategoryId ?? parsedPrimaryId,
      ...(expectedActive !== undefined
        ? {
            category_active: expectedActive,
            isActive: expectedActive,
            is_active: expectedActive,
            active: expectedActive,
          }
        : {}),
    };

    const bodyBasedUrls = [
      `${API_NEXT}/v1/api/category/update`,
      `${API_NEXT}/v1/api/category/status`,
      `${API_NEXT}/v1/api/category/active`,
    ];

    for (const upstreamUrl of bodyBasedUrls) {
      for (const method of methodOrder) {
        try {
          const { data: dataResponse } = await axios({
            url: upstreamUrl,
            method,
            data: bodyEndpointPayload,
            headers,
          });

          if (didCategoryUpdateSucceed(dataResponse)) {
            return NextResponse.json(
              normalizeCategoryResponse(dataResponse, expectedActive),
            );
          }
        } catch (err: unknown) {
          lastError = err;
        }
      }
    }

    throw (
      firstStructuredError ||
      lastError ||
      new Error("Không thể cập nhật trạng thái category_active trong database")
    );
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
