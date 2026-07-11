import { cookies } from "next/headers";
import crypto from "crypto";

const CSRF_COOKIE = "csrf-token";

export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_COOKIE)?.value;
  if (!token) {
    token = crypto.randomBytes(32).toString("hex");
    cookieStore.set(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }
  return token;
}

export async function validateCsrf(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  if (!cookieToken) return false;

  const headerToken = request.headers.get("x-csrf-token");

  if (headerToken) {
    return crypto.timingSafeEqual(
      Buffer.from(headerToken),
      Buffer.from(cookieToken)
    );
  }

  try {
    const clone = request.clone();
    const body = await clone.json();
    if (body._csrf === cookieToken) return true;
  } catch {
  }

  return false;
}