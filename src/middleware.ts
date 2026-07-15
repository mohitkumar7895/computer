import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

function isPublicAdminApi(pathname: string): boolean {
  return (
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/register" ||
    pathname === "/api/admin/logout"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/admin/")) return NextResponse.next();
  if (isPublicAdminApi(pathname)) return NextResponse.next();

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ message: "Server misconfigured." }, { status: 500 });
  }

  const cookieToken = request.cookies.get("admin_token")?.value || "";
  const bearer = request.headers.get("authorization")?.replace("Bearer ", "").trim() || "";
  const encodedSecret = new TextEncoder().encode(secret);

  let authorized = false;
  for (const token of [cookieToken, bearer]) {
    if (!token) continue;
    try {
      const { payload } = await jwtVerify(token, encodedSecret);
      if (payload.role === "admin") {
        authorized = true;
        break;
      }
    } catch {
      // try the other token source
    }
  }

  if (!authorized) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"],
};

