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

function extractArrayFromPayload(payload: any): any[] | null {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload;
  const meta = payload.metadata ?? payload.data ?? payload.result;
  if (Array.isArray(meta)) return meta;
  if (meta && typeof meta === "object") {
    for (const key of ["categories", "category", "list", "items", "docs", "results", "data"]) {
      if (Array.isArray(meta[key])) return meta[key];
    }
  }
  return null;
}

function getCategoryItemKey(item: any): string {
  return String(
    item?._id ??
      item?.category_id ??
      item?.id ??
      item?.category_slug ??
      item?.category_name ??
      JSON.stringify(item),
  );
}

function mergeCategoryPayloads(primary: any, secondary: any): any {
  const arr1 = extractArrayFromPayload(primary);
  const arr2 = extractArrayFromPayload(secondary);
  if (!arr1 && !arr2) return primary ?? secondary;
  if (!arr2 || arr2.length === 0) return primary;
  if (!arr1 || arr1.length === 0) return secondary;

  const keys1 = new Set(
    arr1.filter((i) => i && typeof i === "object").map(getCategoryItemKey),
  );
  const keys2 = new Set(
    arr2.filter((i) => i && typeof i === "object").map(getCategoryItemKey),
  );

  const seen = new Set<string>();
  const merged: any[] = [];

  for (const item of arr1) {
    if (!item || typeof item !== "object") continue;
    const key = getCategoryItemKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      const inferredActive =
        item.category_active !== undefined
          ? item.category_active
          : !keys2.has(key)
            ? true
            : undefined;
      merged.push(
        inferredActive !== undefined
          ? { ...item, category_active: inferredActive }
          : item,
      );
    }
  }

  for (const item of arr2) {
    if (!item || typeof item !== "object") continue;
    const key = getCategoryItemKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      const inferredActive =
        item.category_active !== undefined
          ? item.category_active
          : !keys1.has(key)
            ? false
            : undefined;
      merged.push(
        inferredActive !== undefined
          ? { ...item, category_active: inferredActive }
          : item,
      );
    }
  }

  if (Array.isArray(primary)) return merged;
  if (primary && typeof primary === "object") {
    if (Array.isArray(primary.metadata)) {
      return { ...primary, metadata: merged };
    }
    if (Array.isArray(primary.data)) {
      return { ...primary, data: merged };
    }
    if (primary.metadata && typeof primary.metadata === "object") {
      for (const key of ["categories", "category", "list", "items", "docs", "results", "data"]) {
        if (Array.isArray(primary.metadata[key])) {
          return {
            ...primary,
            metadata: {
              ...primary.metadata,
              [key]: merged,
            },
          };
        }
      }
    }
  }
  return {
    ...(primary && typeof primary === "object" ? primary : {}),
    metadata: merged,
  };
}

async function fetchUpstreamCategoryList(
  upstreamUrl: string,
  headers: Record<string, string>,
  params?: Record<string, unknown>,
): Promise<any> {
  const apiKeyOnlyHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    [REQUEST_HEADER_API_KEY]: headers[REQUEST_HEADER_API_KEY],
  };

  try {
    const { data } = await axios.get(upstreamUrl, {
      headers,
      params,
      data: params,
    });
    return data;
  } catch (getErr: unknown) {
    const status = (getErr as { response?: { status?: number } })?.response
      ?.status;

    if (headers.authorization && (status === 401 || status === 403 || status === 500)) {
      try {
        const { data: publicGetResponse } = await axios.get(upstreamUrl, {
          headers: apiKeyOnlyHeaders,
          params,
          data: params,
        });
        return publicGetResponse;
      } catch {
        // Fall through to POST fallback
      }
    }

    if (status === 400 || status === 404 || status === 405) {
      const { data: postDataResponse } = await axios.post(
        upstreamUrl,
        params || {},
        { headers, params },
      );
      return postDataResponse;
    }
    throw getErr;
  }
}

export async function GET(req: Request): Promise<Response> {
  try {
    if (!API_NEXT) {
      return NextResponse.json(
        { message: "Server misconfiguration: NEXT_PUBLIC_API_URL not set" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(req.url);
    const hasExplicitActiveParam = searchParams.has("category_active");
    const queryObj: Record<string, unknown> = {};
    searchParams.forEach((val, key) => {
      queryObj[key] = val === "false" ? false : val === "true" ? true : val;
    });

    const upstreamBaseUrl = `${API_NEXT}/v1/api/category/all/list`;
    const headers = buildUpstreamHeaders(req);

    if (hasExplicitActiveParam) {
      const dataResponse = await fetchUpstreamCategoryList(
        upstreamBaseUrl,
        headers,
        queryObj,
      );
      return NextResponse.json(dataResponse);
    }

    // Fetch both default and category_active=false so inactive categories are always included
    const [defaultRes, inactiveRes] = await Promise.allSettled([
      fetchUpstreamCategoryList(upstreamBaseUrl, headers, queryObj),
      fetchUpstreamCategoryList(upstreamBaseUrl, headers, {
        ...queryObj,
        category_active: false,
      }),
    ]);

    if (defaultRes.status === "fulfilled" && inactiveRes.status === "fulfilled") {
      return NextResponse.json(
        mergeCategoryPayloads(defaultRes.value, inactiveRes.value),
      );
    }
    if (defaultRes.status === "fulfilled") {
      return NextResponse.json(defaultRes.value);
    }
    if (inactiveRes.status === "fulfilled") {
      return NextResponse.json(inactiveRes.value);
    }

    throw defaultRes.reason;
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

export async function POST(req: Request): Promise<Response> {
  try {
    if (!API_NEXT) {
      return NextResponse.json(
        { message: "Server misconfiguration: NEXT_PUBLIC_API_URL not set" },
        { status: 500 },
      );
    }

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const headers = buildUpstreamHeaders(req);

    const { data: dataResponse } = await axios.get(
      `${API_NEXT}/v1/api/category/all/list`,
      {
        headers,
        params: body,
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
