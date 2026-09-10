import { NextResponse } from "next/server";

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("sb-access-token")?.value;

  // Proteksi rute privat /dashboard
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/";
      return NextResponse.redirect(loginUrl);
    }
  }

  // Pengguna yang sudah login diarahkan dari halaman masuk (/) ke /dashboard
  if (pathname === "/") {
    if (token) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};

export default proxy;
