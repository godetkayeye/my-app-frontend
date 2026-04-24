import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/notes") && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if ((pathname === "/" || pathname === "/register") && token) {
    return NextResponse.redirect(new URL("/notes", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/register", "/notes/:path*"],
};
