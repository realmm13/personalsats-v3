import { NextRequest, NextResponse } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import { serverEnv } from "@/env";
import type { Session } from "@/server/auth";
import { getSessionCookie } from "better-auth/cookies";

const allowedOrigins = [
  "https://personalsats.com",
  "https://www.personalsats.com",
  "http://localhost:3000"
];

const authRoutes = ["/signin", "/signup", "/email-verified"];
const passwordRoutes = ["/reset-password", "/forgot-password"];
const adminRoutes = ["/admin"];
const alwaysAllowedRoutes = [
  "/home",
  "/blog",
  "/email-verified",
  "/about",
  "/contact",
  "/pricing",
  "/env-client",
];

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const method = req.method;
  const pathname = req.nextUrl.pathname;

  // 1. Preflight: allow OPTIONS early
  if (method === "OPTIONS") {
    const res = new NextResponse(null, { status: 200 });
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    return res;
  }

  // 2. Base response (continue with normal logic)
  const res = NextResponse.next();

  // 3. Apply CORS to all other responses for API routes
  if (pathname.startsWith("/api") && allowedOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  }

  // 4. Only run auth logic for non-API routes
  if (!pathname.startsWith("/api")) {
    return authMiddleware(req) ?? res;
  }

  return res;
}

async function authMiddleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const pathName = request.nextUrl.pathname;

  if (pathName === "/") {
    const redirectPath = sessionCookie ? "/app" : "/home";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  const isAuthRoute = authRoutes.includes(pathName);
  const isPasswordRoute = passwordRoutes.includes(pathName);
  const isAdminRoute = adminRoutes.includes(pathName);
  const alwaysAllowedRoute = alwaysAllowedRoutes.some((route) =>
    pathName.startsWith(route),
  );

  if (alwaysAllowedRoute) return NextResponse.next();

  if (!sessionCookie) {
    if (isAuthRoute || isPasswordRoute) {
      return NextResponse.next();
    }

    return NextResponse.rewrite(new URL("/signin", request.url));
  }

  if (isAdminRoute) {
    const { data: session } = await betterFetch<Session>(
      "/api/auth/get-session",
      {
        baseURL: serverEnv.NEXT_PUBLIC_APP_URL,
        headers: {
          cookie: request.headers.get("cookie") ?? "",
        },
      },
    );

    //this is extra protection, every trpc query/mutation should check if the user is admin
    const isAdmin = session?.user.role === "admin";
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run middleware for all routes (including /api), but logic inside will split
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
