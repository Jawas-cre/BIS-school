import { NextResponse, type NextRequest } from "next/server";
import { decrypt, SESSION_COOKIE } from "@/lib/session";
import { MOCK_ONLY, STAFF_LOGIN } from "@/lib/app-mode";

// /mock is the CD IELTS mock app: it checks its own candidate login (and staff pages check BIS Learn's).
const PUBLIC_PREFIXES = ["/login", "/register", "/join", "/setup", "/c/", "/mock"];

// Optimistic auth check only; every page and action re-verifies through the DAL.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // The CD mock on its own site: only its pages exist; everything else leads to the candidate site.
  // /setup stays open for a first start without an admin account (it creates the center and admin).
  if (MOCK_ONLY && !pathname.startsWith("/mock") && pathname !== "/setup") {
    const url = new URL(pathname === "/login" ? STAFF_LOGIN : "/mock", req.nextUrl);
    const next = req.nextUrl.searchParams.get("next");
    if (pathname === "/login" && next) url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }
  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isPublic && !session) {
    const url = new URL(STAFF_LOGIN, req.nextUrl);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:png|svg|jpg|ico|webp)$).*)"],
};
