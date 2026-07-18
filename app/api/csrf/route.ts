// app/api/csrf/route.ts
// Setzt den csrf-token-Cookie via lib/csrf.ts und gibt { token } zurück.

import { getCsrfToken } from "@/lib/csrf";
import { NextResponse } from "next/server";

export async function GET() {
  const token = await getCsrfToken();
  return NextResponse.json({ token });
}
