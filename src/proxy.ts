import { NextResponse, type NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

// /mock is the CD IELTS mock app: it checks its own candidate login (and staff pages check BIS Learn's).
const PUBLIC_PREFIXES = ["/login", "/register", "/join", "/setup", "/c/", "/mock"];

// Optimistic auth check only; every page and action re-verifies through the DAL.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await decrypt(req.cookies.get("session")?.value);
  const isPublic = pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isPublic && !session) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:png|svg|jpg|ico|webp)$).*)"],
};
