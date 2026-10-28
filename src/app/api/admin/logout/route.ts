import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
