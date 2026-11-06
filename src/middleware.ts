import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/config";

/**
 * Middleware proteksi route (Edge runtime — hanya config edge-safe).
 *
 * Middleware adalah lapis pertama (UX redirect cepat). Pengecekan otorisasi
 * final SELALU dilakukan ulang server-side oleh guard/layout modul identitas
 * (defense in depth) — middleware tidak menjadi satu-satunya kontrol.
 */

const { auth: middlewareAuth } = NextAuth(authConfig);

export default middlewareAuth((req) => {
  const isLoggedIn = Boolean(req.auth?.user);
  const roles = req.auth?.user?.roles ?? [];
  const pathname = req.nextUrl.pathname;

  // Halaman admin: hanya role sisi admin.
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/masuk", req.nextUrl.origin);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const isAdminSide = roles.some((r) => r === "ADMIN" || r === "SUPERADMIN" || r === "INSTRUCTOR");
    if (!isAdminSide) {
      return NextResponse.redirect(new URL("/akun?akses=admin-ditolak", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  // Halaman akun: wajib login.
  if (pathname.startsWith("/akun")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/masuk", req.nextUrl.origin);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Halaman auth untuk yang sudah login → arahkan ke akun.
  if (pathname === "/masuk" || pathname === "/daftar") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/akun", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/akun/:path*",
    "/admin/:path*",
    "/masuk",
    "/daftar",
    "/lupa-sandi",
    "/reset-sandi",
  ],
};
