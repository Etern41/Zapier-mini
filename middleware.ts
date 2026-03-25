import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicPagePrefixes = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthed = !!req.auth;

  const isWebhook = pathname.startsWith("/api/webhooks/");
  const isDocs =
    pathname === "/api/docs" || pathname === "/api/openapi.json";

  if (pathname.startsWith("/api")) {
    if (isWebhook || isDocs) return NextResponse.next();
    return NextResponse.next();
  }

  const isPublicPage = publicPagePrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!isAuthed && !isPublicPage) {
    const u = new URL("/login", req.url);
    u.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(u);
  }

  if (isAuthed && isPublicPage) {
    return NextResponse.redirect(new URL("/workflows", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
