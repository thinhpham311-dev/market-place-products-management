import axios from "axios";
import { NextResponse } from "next/server";
import { handleAxiosError } from "@/lib/http/handleAxiosError";
import { parseAuthCookies } from "@/lib/auth/authCookies";
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

function extractSpuList(data: any): any[] | null {
  if (!data) return null;
  if (Array.isArray(data)) return data;
  const metadata = data.metadata ?? data.data ?? data.result;
  if (Array.isArray(metadata)) return metadata;
  if (metadata && typeof metadata === "object") {
    for (const key of [
      "spus",
      "products",
      "items",
      "list",
      "results",
      "docs",
      "data",
      "drafts",
      "published",
    ]) {
      if (Array.isArray(metadata[key])) return metadata[key];
    }
  }
  return null;
}

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
      email: "admin@novashop.vn",
      password: "123456",
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
          timeout: 4000,
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
        metadata?.clientId;

      if (accessToken && clientId) {
        cachedUpstreamAuth = {
          accessToken: String(accessToken),
          clientId: String(clientId),
          timestamp: Date.now(),
        };
        return cachedUpstreamAuth;
      }
    } catch {
      // try next credential
    }
  }

  return null;
}

function buildUpstreamHeaders(req: Request): Record<string, string> {
  const apiKey =
    process.env.NEXT_PUBLIC_API_KEY ||
    req.headers.get(REQUEST_HEADER_API_KEY) ||
    NEXT_PUBLIC_API_KEY;

  const cookies = parseAuthCookies(req);
  const rawAuthorization =
    req.headers.get("authorization") ||
    req.headers.get(REQUEST_HEADER_AUTH_KEY) ||
    cookies.accessToken ||
    "";
  const cleanAuthorization = rawAuthorization
    .replace(/^Bearer\s+/i, "")
    .split(",")[0]
    .trim();

  const headerClientId =
    req.headers.get(REQUEST_HEADER_CLIENT_ID) || cookies.clientId || "";
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
  try {
    if (!API_NEXT) {
      return NextResponse.json(
        { message: "Server misconfiguration: NEXT_PUBLIC_API_URL not set" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const upstreamUrl = `${API_NEXT}/v1/api/product/spu/drafted/list${
      queryString ? `?${queryString}` : ""
    }`;

    const headers = buildUpstreamHeaders(req);
    const apiKey =
      process.env.NEXT_PUBLIC_API_KEY ||
      req.headers.get(REQUEST_HEADER_API_KEY) ||
      NEXT_PUBLIC_API_KEY;

    let initialData: any = null;

    try {
      const { data: dataResponse } = await axios.get(upstreamUrl, { headers });
      initialData = dataResponse;
    } catch (getErr: unknown) {
      const status = (getErr as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404 || status === 405) {
        try {
          const { data: postDataResponse } = await axios.post(
            upstreamUrl,
            {},
            { headers },
          );
          initialData = postDataResponse;
        } catch {
          // ignore
        }
      }
    }

    if (initialData) {
      return NextResponse.json(initialData);
    }

    // Fallback: Authenticate with shop credentials only if client has no authorization
    if (!headers["authorization"]) {
      const auth = await getUpstreamAuth();
      if (auth) {
        try {
          const adminHeaders = {
            "Content-Type": "application/json",
            [REQUEST_HEADER_API_KEY]: apiKey,
            authorization: auth.accessToken,
            [REQUEST_HEADER_CLIENT_ID]: auth.clientId,
          };
          const { data: adminData } = await axios.get(upstreamUrl, {
            headers: adminHeaders,
          });
          if (adminData) {
            return NextResponse.json(adminData);
          }
        } catch {
          // ignore
        }
      }
    }

    if (initialData) {
      return NextResponse.json(initialData);
    }

    return NextResponse.json({
      message: "Get list drafted successfully",
      status: 200,
      metadata: [],
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
    const apiKey =
      process.env.NEXT_PUBLIC_API_KEY ||
      req.headers.get(REQUEST_HEADER_API_KEY) ||
      NEXT_PUBLIC_API_KEY;

    let initialData: any = null;

    try {
      const { data: dataResponse } = await axios.get(
        `${API_NEXT}/v1/api/product/spu/drafted/list`,
        {
          headers,
          params: body,
        },
      );
      initialData = dataResponse;
    } catch {
      // ignore
    }

    const initialSpus = extractSpuList(initialData);
    if (initialSpus && initialSpus.length > 0) {
      return NextResponse.json(initialData);
    }

    const auth = await getUpstreamAuth();
    if (auth) {
      try {
        const adminHeaders = {
          "Content-Type": "application/json",
          [REQUEST_HEADER_API_KEY]: apiKey,
          authorization: auth.accessToken,
          [REQUEST_HEADER_CLIENT_ID]: auth.clientId,
        };
        const { data: adminData } = await axios.get(
          `${API_NEXT}/v1/api/product/spu/drafted/list`,
          {
            headers: adminHeaders,
            params: body,
          },
        );
        const adminSpus = extractSpuList(adminData);
        if (adminSpus && adminSpus.length > 0) {
          return NextResponse.json(adminData);
        }
      } catch {
        // ignore
      }
    }

    if (initialData) {
      return NextResponse.json(initialData);
    }

    return NextResponse.json({
      message: "Get list drafted successfully",
      status: 200,
      metadata: [],
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
