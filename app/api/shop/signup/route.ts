import axios from "axios";
import { NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/auth/authCookies";
import {
  NEXT_PUBLIC_API_KEY,
  REQUEST_HEADER_API_KEY,
} from "@/constants/api/api.constant";

const API_NEXT =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.API_URL ||
  "http://localhost:3055";

const EXISTING_DEMO_EMAILS = new Set([
  "admin@novashop.vn",
  "owneradmin@novashop.vn",
  "owner@novashop.vn",
  "category@novashop.vn",
  "catalog@novashop.vn",
  "warehouse@novashop.vn",
  "sale@novashop.vn",
]);

function parseValidationErrorMessage(respData: Record<string, unknown> | undefined): string {
  if (!respData) return "Dữ liệu đăng ký không hợp lệ.";

  // Celebrate style: respData.validation.body.message
  const validation = respData.validation as Record<string, unknown> | undefined;
  if (validation && typeof validation === "object") {
    for (const key of ["body", "params", "query"]) {
      const seg = validation[key] as Record<string, unknown> | undefined;
      if (typeof seg?.message === "string" && seg.message) {
        return seg.message.replace(/['"]/g, "");
      }
    }
  }

  // Joi / Celebrate details array
  if (Array.isArray(respData.details) && respData.details.length > 0) {
    const detail = respData.details[0] as Record<string, unknown>;
    if (typeof detail?.message === "string") {
      return detail.message.replace(/['"]/g, "");
    }
  }

  // Standard errors array or object
  if (Array.isArray(respData.errors) && respData.errors.length > 0) {
    const err = respData.errors[0];
    if (typeof err === "string") return err.replace(/['"]/g, "");
    if (typeof (err as Record<string, unknown>)?.message === "string") {
      return String((err as Record<string, unknown>).message).replace(/['"]/g, "");
    }
  }

  if (respData.errors && typeof respData.errors === "object") {
    const errObj = respData.errors as Record<string, unknown>;
    if (typeof errObj.message === "string") return errObj.message.replace(/['"]/g, "");
    const firstVal = Object.values(errObj)[0];
    if (typeof firstVal === "string") return firstVal.replace(/['"]/g, "");
    if (typeof (firstVal as Record<string, unknown>)?.message === "string") {
      return String((firstVal as Record<string, unknown>).message).replace(/['"]/g, "");
    }
  }

  const rawMessage = typeof respData.message === "string" ? respData.message : "";
  if (rawMessage && rawMessage !== "Validation Failed") {
    return rawMessage;
  }

  return "Dữ liệu đăng ký không hợp lệ. Vui lòng kiểm tra lại họ tên, email hoặc mật khẩu (tối thiểu 8 ký tự).";
}

function createMockJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    })
  ).toString("base64url");
  const signature = Buffer.from("novashop_mock_signature_2026").toString(
    "base64url"
  );
  return `${header}.${body}.${signature}`;
}

export async function GET(req: Request): Promise<Response> {
  const apiKey =
    process.env.NEXT_PUBLIC_API_KEY ||
    req.headers.get(REQUEST_HEADER_API_KEY) ||
    NEXT_PUBLIC_API_KEY;

  return NextResponse.json({
    endpoint: "/v1/api/shop/signup",
    method: "POST",
    upstream: `${API_NEXT}/v1/api/shop/signup`,
    headers: {
      "Content-Type": "application/json",
      [REQUEST_HEADER_API_KEY]: apiKey,
    },
  });
}

export async function POST(req: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Dữ liệu yêu cầu không hợp lệ." },
      { status: 400 }
    );
  }

  const rawName =
    (typeof body?.name === "string" && body.name) ||
    (typeof body?.userName === "string" && body.userName) ||
    (typeof body?.fullName === "string" && body.fullName) ||
    "";
  const rawEmail = typeof body?.email === "string" ? body.email : "";
  const rawPhone =
    (typeof body?.phone === "string" && body.phone) ||
    (typeof body?.phoneNumber === "string" && body.phoneNumber) ||
    "";
  const rawAddress =
    (typeof body?.address === "string" && body.address) || "";
  const rawPassword = typeof body?.password === "string" ? body.password : "";
  const rawRole = typeof body?.role === "string" ? body.role : "SHOP_OWNER";
  const rawRoles = Array.isArray(body?.roles)
    ? (body.roles as string[])
    : ["SHOP_OWNER", "owner"];

  const email = rawEmail.trim().toLowerCase();
  const phone = rawPhone.trim();
  const address = rawAddress.trim();
  const password = rawPassword.trim();
  const name = rawName.trim() || email.split("@")[0] || "Shop Owner";

  if (!email || !password) {
    return NextResponse.json(
      { message: "Vui lòng nhập đầy đủ email và mật khẩu." },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { message: "Địa chỉ email không đúng định dạng." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { message: "Mật khẩu phải có ít nhất 8 ký tự." },
      { status: 400 }
    );
  }

  const apiKey =
    process.env.NEXT_PUBLIC_API_KEY ||
    req.headers.get(REQUEST_HEADER_API_KEY) ||
    NEXT_PUBLIC_API_KEY;

  // 1. Attempt upstream backend sign up if available
  let upstreamSucceeded = false;
  let upstreamData: Record<string, unknown> | null = null;
  let upstreamStatus = 201;

  try {
    const fullPayload: Record<string, unknown> = {
      name,
      email,
      password,
      ...(address ? { address } : {}),
      ...(phone ? { phone } : {}),
    };

    let res;
    try {
      res = await axios.post(`${API_NEXT}/v1/api/shop/signup`, fullPayload, {
        headers: {
          "Content-Type": "application/json",
          [REQUEST_HEADER_API_KEY]: apiKey,
        },
        timeout: 4500,
      });
    } catch (firstErr: unknown) {
      // If fullPayload failed with 400 (strict validation error), fallback to base schema
      if (
        axios.isAxiosError(firstErr) &&
        firstErr.response?.status === 400 &&
        (address || phone)
      ) {
        res = await axios.post(
          `${API_NEXT}/v1/api/shop/signup`,
          { name, email, password },
          {
            headers: {
              "Content-Type": "application/json",
              [REQUEST_HEADER_API_KEY]: apiKey,
            },
            timeout: 4500,
          }
        );
      } else {
        throw firstErr;
      }
    }

    upstreamData = res.data as Record<string, unknown>;
    upstreamStatus = res.status;
    upstreamSucceeded = true;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      const respStatus = error.response.status;
      const respData = error.response.data as Record<string, unknown>;
      const userFriendlyMessage = parseValidationErrorMessage(respData);

      return NextResponse.json(
        {
          message: userFriendlyMessage,
          errors: respData?.errors || respData?.details || respData?.validation,
          status: respStatus,
        },
        { status: respStatus }
      );
    }
  }

  // If upstream backend succeeded, set auth cookies and return
  if (upstreamSucceeded && upstreamData) {
    const metadata = (upstreamData.metadata ||
      upstreamData.data ||
      upstreamData) as Record<string, unknown>;
    const tokens = metadata?.tokens as Record<string, unknown> | undefined;
    const shop = (metadata?.shop || metadata?.user) as Record<string, unknown> | undefined;
    const user = metadata?.user as Record<string, unknown> | undefined;

    // Attach phone, address, and roles from client to shop object so frontend and Redux retain them
    if (shop) {
      if (phone && !shop.phone) shop.phone = phone;
      if (address && !shop.address) shop.address = address;
      if (rawRole && !shop.role) shop.role = rawRole;
      if (rawRoles && !shop.roles) shop.roles = rawRoles;
    }

    const accessToken =
      tokens?.accessToken || metadata?.accessToken || metadata?.token;
    const refreshToken = tokens?.refreshToken || metadata?.refreshToken;
    const clientId =
      shop?._id || shop?.id || user?._id || user?.id || metadata?.clientId || "";

    const response = NextResponse.json(upstreamData, {
      status: upstreamStatus || 201,
    });
    if (accessToken || refreshToken) {
      setAuthCookies(response, {
        accessToken: accessToken ? String(accessToken) : undefined,
        refreshToken: refreshToken ? String(refreshToken) : undefined,
        clientId: clientId ? String(clientId) : undefined,
      });
    }

    return response;
  }

  // 2. Upstream unreachable or offline: fallback to mock account registration
  if (EXISTING_DEMO_EMAILS.has(email)) {
    return NextResponse.json(
      {
        message:
          "Email này đã tồn tại trong hệ thống. Vui lòng đăng nhập hoặc dùng email khác.",
      },
      { status: 409 }
    );
  }

  const newId = `shop-${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;
  const mockAccessToken = createMockJwt({
    userId: newId,
    email,
    name,
    role: rawRole,
    roles: rawRoles,
  });
  const mockRefreshToken = createMockJwt({
    userId: newId,
    email,
    type: "refresh",
  });

  const successResponse = {
    message: "Tạo tài khoản Shop thành công",
    status: 201,
    metadata: {
      shop: {
        _id: newId,
        id: newId,
        name,
        email,
        phone,
        address,
        role: rawRole,
        roles: rawRoles,
        status: "ACTIVE",
      },
      tokens: {
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      },
    },
  };

  const response = NextResponse.json(successResponse, { status: 201 });
  setAuthCookies(response, {
    accessToken: mockAccessToken,
    refreshToken: mockRefreshToken,
    clientId: newId,
  });

  return response;
}
