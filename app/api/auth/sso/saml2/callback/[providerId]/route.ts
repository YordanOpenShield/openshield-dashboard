import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  return auth.handler(req);
}

export async function GET(req: NextRequest) {
  // Required: IdP-initiated flows redirect to this URL after POST
  return NextResponse.redirect(new URL("/login", req.url));
}
