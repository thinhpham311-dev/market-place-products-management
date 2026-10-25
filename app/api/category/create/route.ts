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

export async function GET(req: Request): Promise<Response> {
  const headers = buildUpstreamHeaders(req);

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
    const headers = buildUpstreamHeaders(req);
    const requestedActive =
      body?.category_active !== undefined
        ? Boolean(body.category_active)
        : undefined;

    const rawParentId =
      body?.parent_id ??
      body?.parent_category_id ??
      body?.category_parentId ??
      body?.parentId ??
      null;

    const cleanParentId =
      rawParentId !== null &&
      rawParentId !== undefined &&
      String(rawParentId).trim() !== "" &&
      String(rawParentId).trim() !== "null" &&
      String(rawParentId).trim() !== "0" &&
      String(rawParentId).trim() !== "root"
        ? String(rawParentId).trim()
        : null;

    const parentIdCandidates = cleanParentId
      ? Array.from(
          new Set(
            [
              /^\d+$/.test(cleanParentId) ? Number(cleanParentId) : undefined,
              cleanParentId,
            ].filter((v) => v !== undefined && v !== null && String(v).trim() !== ""),
          ),
        )
      : [null];

    const categoryName = body?.category_name ?? body?.name ?? "Danh mục mới";
    const categorySlug = body?.category_slug ?? body?.slug ?? "";
    const categoryDesc = body?.category_description ?? body?.description ?? "";
    const categoryImg =
      body?.category_image ?? body?.category_thumb ?? body?.image ?? "";

    const payloadVariants: Array<Record<string, unknown>> = parentIdCandidates.map(
      (parentCand) => ({
        category_name: categoryName,
        category_description: categoryDesc,
        category_slug: categorySlug,
        category_active: requestedActive ?? true,
        category_image: categoryImg,
        category_thumb: categoryImg,
        parent_id: parentCand,
        sort_order: body?.sort_order ?? 0,
      }),
    );

    let dataResponse: unknown = null;
    let lastError: unknown = null;

    const postCategoryWithSlugRetry = async (
      payload: Record<string, unknown>,
    ): Promise<unknown> => {
      try {
        const { data } = await axios.post(
          `${API_NEXT}/v1/api/category/create`,
          payload,
          { headers },
        );
        return data;
      } catch (err: unknown) {
        const errObj = (err as { response?: { data?: unknown; status?: number } })?.response?.data;
        const errMsg = String(
          (errObj as Record<string, unknown>)?.message || (err as Error)?.message || "",
        );

        // If duplicate slug error (E11000), append timestamp counter and retry
        if (
          errMsg.includes("E11000") ||
          errMsg.includes("category_slug") ||
          errMsg.includes("duplicate key")
        ) {
          const base = String(payload.category_slug || "cat");
          const retrySlug = `${base}-${Date.now().toString().slice(-4)}`;
          const { data } = await axios.post(
            `${API_NEXT}/v1/api/category/create`,
            { ...payload, category_slug: retrySlug },
            { headers },
          );
          return data;
        }
        throw err;
      }
    };

    for (const payloadToTry of payloadVariants) {
      try {
        dataResponse = await postCategoryWithSlugRetry(payloadToTry);
        break;
      } catch (err: unknown) {
        lastError = err;
        console.error(
          "Create category variant failed:",
          (err as { response?: { data?: unknown; status?: number } })?.response
            ?.data || (err as Error)?.message,
        );
      }
    }

    if (!dataResponse) {
      throw lastError || new Error("Failed to create category on upstream server");
    }

    const createdDoc = extractCreatedDoc(dataResponse);
    if (createdDoc && cleanParentId) {
      if (!createdDoc.parent_id) {
        createdDoc.parent_id = cleanParentId;
      }
    }

    if (requestedActive === true && createdDoc) {
      const createdActive =
        createdDoc.category_active ??
        createdDoc.is_active ??
        createdDoc.isActive ??
        createdDoc.active;

      if (createdActive !== true && createdActive !== "true" && createdActive !== 1) {
        const candidateIds = Array.from(
          new Set(
            [
              createdDoc._id,
              createdDoc.category_id,
              createdDoc.id,
            ]
              .filter((v) => v !== undefined && v !== null && String(v).trim() !== "")
              .map((v) => String(v).trim()),
          ),
        );

        const updateBody = {
          category_name: createdDoc.category_name ?? body?.category_name,
          category_slug: createdDoc.category_slug ?? body?.category_slug,
          category_description:
            createdDoc.category_description ?? body?.category_description,
          category_thumb: createdDoc.category_thumb ?? body?.category_thumb,
          parent_id: cleanParentId,
          category_active: true,
        };

        for (const targetId of candidateIds) {
          let updated = false;
          for (const method of ["patch", "post", "put"] as const) {
            try {
              const { data: updateRes } = await axios({
                url: `${API_NEXT}/v1/api/category/update/${encodeURIComponent(
                  targetId,
                )}`,
                method,
                data: updateBody,
                headers,
              });
              const updatedDoc = extractCreatedDoc(updateRes);
              if (updatedDoc && updatedDoc.category_active === true) {
                createdDoc.category_active = true;
                updated = true;
                break;
              }
              createdDoc.category_active = true;
              updated = true;
              break;
            } catch {
              // Try next method / candidate ID
            }
          }
          if (updated) break;
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
