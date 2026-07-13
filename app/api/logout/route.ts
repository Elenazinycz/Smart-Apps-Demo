import { validateCsrf } from '@/lib/csrf';
import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export async function POST() {
  if (!(await validateCsrf(new Request('http://localhost')))) return NextResponse.json({ error: 'Ungueltiger CSRF-Token.' }, { status: 403 });
  await clearSession();
  return NextResponse.json({ success: true });
}


