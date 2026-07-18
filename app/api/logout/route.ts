import { validateCsrf } from '@/lib/csrf';
import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export async function POST(req: Request) {
  if (!(await validateCsrf(req))) return NextResponse.json({ error: 'Ungueltiger CSRF-Token.' }, { status: 403 });
  await clearSession();
  return NextResponse.json({ success: true });
}


