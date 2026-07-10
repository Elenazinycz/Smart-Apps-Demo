import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login", "/api/login"];
const STATIC_ASSETS = /\.(png|jpg|jpeg|gif|svg|css|js|ico|woff2?)$/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Statische Assets und API-Public immer erlauben
  if (STATIC_ASSETS.test(pathname)) return NextResponse.next();

  // Public Routes erlauben
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) return NextResponse.next();

  // Session-Cookie prüfen
  const token = req.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
