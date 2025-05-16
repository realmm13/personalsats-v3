import { betterFetch } from "@better-fetch/fetch";
import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/env";
import type { Session } from "@/server/auth";
import { getSessionCookie } from "better-auth/cookies";

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

// CORS configuration
const allowedOrigins = [
  'https://personalsats.com',
  'https://www.personalsats.com',
  'http://localhost:3000'
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS for API routes only
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      if (origin && allowedOrigins.includes(origin)) {
        return new NextResponse(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
          },
        });
      }
      return new NextResponse(null, { status: 403 });
    }
    // For actual API requests, add CORS headers if allowed
    if (origin && allowedOrigins.includes(origin)) {
      const response = NextResponse.next();
      response.headers.set('Access-Control-Allow-Origin', origin);
      return response;
    }
    // If no origin or not allowed, just proceed
    return NextResponse.next();
  }

  // For all other routes, run your existing auth logic
  return authMiddleware(request);
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
