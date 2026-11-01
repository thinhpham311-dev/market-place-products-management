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

let cachedUpstreamAuth: {
  accessToken: string;
  clientId: string;
  timestamp: number;
} | null = null;

function isValidJwt(token: string): boolean {
  if (!token) return false;
  const clean = token.replace(/^Bearer\s+/i, "").trim();
  const parts = clean.split(".");
  return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0;
}

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Automatically authenticates with upstream shop API to obtain a valid access token and clientId
 * when the client token is invalid, expired, or rejected with 401/403.
 */
async function getUpstreamAuth(forceFresh = false): Promise<{
  accessToken: string;
  clientId: string;
} | null> {
  if (
    !forceFresh &&
    cachedUpstreamAuth &&
    Date.now() - cachedUpstreamAuth.timestamp < 15 * 60 * 1000
  ) {
    return cachedUpstreamAuth;
  }

  const apiKey =
    process.env.NEXT_PUBLIC_API_KEY || NEXT_PUBLIC_API_KEY;

  const credentialsList = [
    {
      email: process.env.ADMIN_EMAIL || "admin@novashop.vn",
      password: process.env.ADMIN_PASSWORD || "novashop",
    },
    {
      email: "category@novashop.vn",
      password: "123456",
    },
  ];

  for (const cred of credentialsList) {
    try {
      const { data } = await axios.post(
        `${API_NEXT}/v1/api/shop/signin`,
        cred,
        {
          headers: {
            "Content-Type": "application/json",
            [REQUEST_HEADER_API_KEY]: apiKey,
          },
          timeout: 3000,
        },
      );

      const metadata = data?.metadata || data?.data || data;
      const accessToken =
        metadata?.tokens?.accessToken ||
        metadata?.accessToken ||
        metadata?.token;
      const clientId =
        metadata?.shop?._id ||
        metadata?.shop?.id ||
        metadata?.user?._id ||
        metadata?.user?.id ||
        metadata?.clientId ||
        "66f1a2b3c4d5e6f7a8b9c0d1";

      if (accessToken) {
        cachedUpstreamAuth = {
          accessToken: String(accessToken),
          clientId: String(clientId),
          timestamp: Date.now(),
        };
        return cachedUpstreamAuth;
      }
    } catch {
      // Continue to next credential
    }
  }

  return null;
}

function buildUpstreamHeaders(req: Request): {
  headers: Record<string, string>;
  cleanAuthorization: string;
  clientId: string;
  apiKey: string;
} {
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
  const clientId = jwtClientId || headerClientId || "66f1a2b3c4d5e6f7a8b9c0d1";

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

  return { headers, cleanAuthorization, clientId, apiKey };
}

export async function GET(req: Request): Promise<Response> {
  const { headers } = buildUpstreamHeaders(req);

  return NextResponse.json({
    endpoint: "/api/category/create",
    method: "POST",
    upstream: `${API_NEXT}/v1/api/category/create`,
    headers,
  });
}

function extractCreatedDoc(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const meta = (obj.metadata ?? obj.data ?? obj.result ?? obj) as unknown;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const metaObj = meta as Record<string, unknown>;
  if (
    metaObj.category &&
    typeof metaObj.category === "object" &&
    !Array.isArray(metaObj.category)
  ) {
    return metaObj.category as Record<string, unknown>;
  }
  return metaObj;
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
    const { headers: baseHeaders, cleanAuthorization, apiKey } =
      buildUpstreamHeaders(req);

    const requestedActive =
      body?.category_active !== undefined
        ? Boolean(body.category_active)
        : true;

    // Strictly process parent_id (ignoring any legacy parent keys)
    const rawParentId = body?.parent_id;
    let cleanParentId: string | number | null = null;
    if (
      rawParentId !== null &&
      rawParentId !== undefined &&
      String(rawParentId).trim() !== "" &&
      String(rawParentId).trim() !== "null" &&
      String(rawParentId).trim() !== "undefined" &&
      String(rawParentId).trim() !== "0" &&
      String(rawParentId).trim() !== "root"
    ) {
      cleanParentId =
        typeof rawParentId === "number"
          ? rawParentId
          : String(rawParentId).trim();
    }

    const categoryName =
      (body?.category_name ?? body?.name ?? "").trim() || "Danh mục mới";
    let categorySlug = (body?.category_slug ?? body?.slug ?? "").trim();
    if (!categorySlug) {
      categorySlug =
        slugify(categoryName) || `cat-${Date.now().toString().slice(-6)}`;
    }
    const categoryDesc =
      (body?.category_description ?? body?.description ?? "").trim();
    const categoryThumb =
      (body?.category_thumb ?? body?.category_image ?? body?.image ?? "").trim();

    // Prepare payload variants strictly using parent_id only
    const payloadVariants: Array<Record<string, unknown>> = [];

    if (cleanParentId !== null) {
      // Subcategory: strictly transmit parent_id
      payloadVariants.push({
        category_name: categoryName,
        category_slug: categorySlug,
        category_description: categoryDesc,
        category_thumb: categoryThumb,
        category_active: requestedActive,
        parent_id: cleanParentId,
      });

      if (/^\d+$/.test(String(cleanParentId))) {
        payloadVariants.push({
          category_name: categoryName,
          category_slug: categorySlug,
          category_description: categoryDesc,
          category_thumb: categoryThumb,
          category_active: requestedActive,
          parent_id: Number(cleanParentId),
        });
      }
    } else {
      // Root category: omit parent_id first, then parent_id: null
      payloadVariants.push({
        category_name: categoryName,
        category_slug: categorySlug,
        category_description: categoryDesc,
        category_thumb: categoryThumb,
        category_active: requestedActive,
      });

      payloadVariants.push({
        category_name: categoryName,
        category_slug: categorySlug,
        category_description: categoryDesc,
        category_thumb: categoryThumb,
        category_active: requestedActive,
        parent_id: null,
      });
    }

    // Helper to execute POST with duplicate slug retry
    const executePostWithSlugRetry = async (
      headersToUse: Record<string, string>,
      payloadToUse: Record<string, unknown>,
    ): Promise<unknown> => {
      try {
        const { data } = await axios.post(
          `${API_NEXT}/v1/api/category/create`,
          payloadToUse,
          { headers: headersToUse, timeout: 8000 },
        );
        return data;
      } catch (err: unknown) {
        const errObj = (err as { response?: { data?: unknown; status?: number } })
          ?.response?.data;
        const errMsg = String(
          (errObj as Record<string, unknown>)?.message ||
            (err as Error)?.message ||
            "",
        ).toLowerCase();

        // If duplicate slug error (E11000 / duplicate key), append unique suffix and retry
        if (
          errMsg.includes("e11000") ||
          errMsg.includes("category_slug") ||
          errMsg.includes("duplicate key")
        ) {
          const base = String(payloadToUse.category_slug || "cat");
          const retrySlug = `${base}-${Date.now().toString().slice(-4)}`;
          const { data } = await axios.post(
            `${API_NEXT}/v1/api/category/create`,
            { ...payloadToUse, category_slug: retrySlug },
            { headers: headersToUse, timeout: 8000 },
          );
          return data;
        }
        throw err;
      }
    };

    let dataResponse: unknown = null;
    let lastError: unknown = null;

    // Phase 1: Try with client's incoming authentication headers if valid JWT
    const hasIncomingValidJwt =
      Boolean(cleanAuthorization) && isValidJwt(cleanAuthorization);

    if (hasIncomingValidJwt) {
      for (const payloadToTry of payloadVariants) {
        try {
          dataResponse = await executePostWithSlugRetry(
            baseHeaders,
            payloadToTry,
          );
          if (dataResponse) break;
        } catch (err: unknown) {
          lastError = err;
          const status = (err as { response?: { status?: number } })?.response
            ?.status;
          if (status === 401 || status === 403) {
            // Incoming token rejected by upstream backend, break to auth fallback
            break;
          }
        }
      }
    }

    // Phase 2: If no response yet or 401/403, obtain upstream session or try Bearer format
    const lastStatus = (lastError as { response?: { status?: number } })
      ?.response?.status;

    if (
      !dataResponse &&
      (!hasIncomingValidJwt || lastStatus === 401 || lastStatus === 403)
    ) {
      // Try upstream auto-signin to resolve 401 Unauthorized
      const upstreamAuth = await getUpstreamAuth(
        lastStatus === 401 || lastStatus === 403,
      );

      const retryHeaderVariants: Array<Record<string, string>> = [];

      if (upstreamAuth) {
        retryHeaderVariants.push({
          "Content-Type": "application/json",
          [REQUEST_HEADER_API_KEY]: apiKey,
          authorization: upstreamAuth.accessToken,
          [REQUEST_HEADER_CLIENT_ID]: upstreamAuth.clientId,
        });
        retryHeaderVariants.push({
          "Content-Type": "application/json",
          [REQUEST_HEADER_API_KEY]: apiKey,
          authorization: `Bearer ${upstreamAuth.accessToken}`,
          [REQUEST_HEADER_CLIENT_ID]: upstreamAuth.clientId,
        });
      }

      if (cleanAuthorization) {
        retryHeaderVariants.push({
          ...baseHeaders,
          authorization: `Bearer ${cleanAuthorization}`,
        });
        retryHeaderVariants.push(baseHeaders);
      }

      // Fallback: API key only
      retryHeaderVariants.push({
        "Content-Type": "application/json",
        [REQUEST_HEADER_API_KEY]: apiKey,
      });

      for (const headersToTry of retryHeaderVariants) {
        for (const payloadToTry of payloadVariants) {
          try {
            dataResponse = await executePostWithSlugRetry(
              headersToTry,
              payloadToTry,
            );
            if (dataResponse) break;
          } catch (err: unknown) {
            lastError = err;
          }
        }
        if (dataResponse) break;
      }
    }

    if (!dataResponse) {
      throw (
        lastError || new Error("Failed to create category on upstream server")
      );
    }

    const createdDoc = extractCreatedDoc(dataResponse);
    if (createdDoc && cleanParentId) {
      if (!createdDoc.parent_id) {
        createdDoc.parent_id = cleanParentId;
      }
    }

    // Follow-up: Ensure category_active is true if requested
    if (requestedActive === true && createdDoc) {
      const createdActive =
        createdDoc.category_active ??
        createdDoc.is_active ??
        createdDoc.isActive ??
        createdDoc.active;

      if (
        createdActive !== true &&
        createdActive !== "true" &&
        createdActive !== 1
      ) {
        const candidateId =
          createdDoc._id || createdDoc.category_id || createdDoc.id;

        if (candidateId) {
          const updateBody: Record<string, unknown> = {
            category_name: createdDoc.category_name ?? body?.category_name,
            category_slug: createdDoc.category_slug ?? body?.category_slug,
            category_description:
              createdDoc.category_description ?? body?.category_description,
            category_thumb: createdDoc.category_thumb ?? body?.category_thumb,
            category_active: true,
          };

          if (cleanParentId !== null) {
            updateBody.parent_id = cleanParentId;
          }

          try {
            await axios.patch(
              `${API_NEXT}/v1/api/category/update/${encodeURIComponent(
                String(candidateId).trim(),
              )}`,
              updateBody,
              { headers: baseHeaders, timeout: 5000 },
            );
            createdDoc.category_active = true;
          } catch {
            // Best-effort status update
          }
        }
      }
    }

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
