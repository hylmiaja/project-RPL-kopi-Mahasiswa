import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Role } from "@/lib/constants";
import { ROLE_DASHBOARD_PATHS } from "@/lib/constants";

const PUBLIC_ROUTES  = ["/", "/login", "/register", "/menu"];
const AUTH_ROUTES    = ["/login", "/register"];
const DASHBOARD_BASE = "/dashboard";

export default auth(async function middleware(req: NextRequest & { auth: { user?: { role?: Role } } | null }) {
  const { nextUrl } = req;
  const isLoggedIn  = !!req.auth;
  const userRole    = req.auth?.user?.role as Role | undefined;
  const pathname    = nextUrl.pathname;

  // Jika sudah login dan mengakses auth route (login/register) → redirect ke dashboard
  if (isLoggedIn && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    const dashboardPath = userRole
      ? ROLE_DASHBOARD_PATHS[userRole]
      : "/dashboard";
    return NextResponse.redirect(new URL(dashboardPath, req.url));
  }

  // Jika mengakses dashboard tanpa login → redirect ke login
  if (!isLoggedIn && pathname.startsWith(DASHBOARD_BASE)) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, req.url)
    );
  }

  // Role-based access control untuk dashboard
  if (isLoggedIn && pathname.startsWith(DASHBOARD_BASE) && userRole) {
    const allowedPath = ROLE_DASHBOARD_PATHS[userRole];

    // Cek apakah user mengakses dashboard yang bukan miliknya
    if (!pathname.startsWith(allowedPath)) {
      return NextResponse.redirect(new URL(allowedPath, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

