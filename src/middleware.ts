import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;

    if (!role) return NextResponse.next();

    if (path.startsWith("/dashboard/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (path.startsWith("/dashboard/registrar") && role !== "REGISTRAR" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (path.startsWith("/dashboard/faculty") && role !== "FACULTY" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (path.startsWith("/dashboard/student") && role !== "STUDENT" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
