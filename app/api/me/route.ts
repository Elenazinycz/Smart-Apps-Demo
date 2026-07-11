import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-guard";

export async function GET() {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  return NextResponse.json({ authenticated: true, user: session });
}
