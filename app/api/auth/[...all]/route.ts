import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

const handler = auth.handler;

export { handler as GET, handler as POST };
