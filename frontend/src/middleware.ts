import dayjs from "dayjs";
import { jwtDecode } from "jwt-decode";
import { NextRequest, NextResponse } from "next/server";

export type UserEnumType = null | "CREATOR";

export type Tokens = string;

export type UserType = {
  _id: string;
  exp: number;
  iat: number;
};

const loginUrls = ["/login", "/signup", "/forgot-password", "/reset-password"];
const protectedRoutes = [
  "/my-events",
  "/create-event",
  "/edit-event",
  "/my-profile",
];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  let isAuthenticated = false;
  let userType: UserEnumType = null;
  const BASE_FRONTEND_URL = request.nextUrl.origin;
  const CURRENT_URL_PATHNAME = request.nextUrl.pathname;

  const jwtCookie = request.cookies.get("jwt");
  if (jwtCookie) {
    try {
      const authTokens = jwtCookie.value;
      const data = jwtDecode(authTokens) as UserType;
      const isExpired = dayjs.unix(data.exp).diff(dayjs()) < 1;

      if (!isExpired) {
        userType = "CREATOR";
        isAuthenticated = true;
      } else {
        // cookies-next v6 no longer works in middleware - use Next.js native API
        response.cookies.delete("jwt");
      }
    } catch (error) {
      console.error("Failed to decode JWT:", error);
    }
  }

  const hasRoute = (routes: Array<string>, currentPath: string) => {
    let isValid = false;

    routes.forEach((route) => {
      const routeRegex = new RegExp(`^${route}(.*)$`);
      isValid = isValid || routeRegex.test(currentPath);
    });

    return isValid;
  };

  const buildUrl = (route: string) =>
    new URL(route, BASE_FRONTEND_URL).toString();

  if (
    !isAuthenticated &&
    hasRoute(protectedRoutes, CURRENT_URL_PATHNAME) &&
    CURRENT_URL_PATHNAME !== "/login"
  )
    return NextResponse.redirect(buildUrl("/login"));

  if (isAuthenticated && hasRoute(loginUrls, CURRENT_URL_PATHNAME)) {
    return NextResponse.redirect(buildUrl("/"));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
