import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login", "/api/login", "/api/csrf"];
const STATIC_ASSETS = /\.(png|jpg|jpeg|gif|svg|css|js|ico|woff2?)$/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (STATIC_ASSETS.test(pathname)) return NextResponse.next();

  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) return response;

  const token = req.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};