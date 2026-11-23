import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "dmah_admin_session";

/**
 * Fast redirect for signed-out visitors. This only checks that a session cookie
 * exists; the real check (valid, unexpired session for an active user, plus role)
 * happens on the server in every admin page and Server Action via requireStaff().
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
