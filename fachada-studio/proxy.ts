import { NextResponse, type NextRequest } from "next/server";

// Convenience redirect only: checks for a session cookie, never trusts it.
// Every page/action still calls auth() and checks workspace membership.
export function proxy(req: NextRequest) {
  const has =
    req.cookies.has("authjs.session-token") || req.cookies.has("__Secure-authjs.session-token");
  if (!has) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/app/:path*", "/admin/:path*"] };
