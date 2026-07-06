import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { GUEST_COOKIE_NAME, hashPassword } from "@/lib/guest-access";

async function hasGuestAccess(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get(GUEST_COOKIE_NAME)?.value;
  if (!cookie) return false;

  const expected = await hashPassword(process.env.SITE_PASSWORD ?? "");
  return cookie === expected;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Door 1: the shared guest password, required for the entire site.
  // /enter-password itself is the one page exempt from this check —
  // everything else (including /admin) redirects here without it.
  if (pathname !== "/enter-password" && !(await hasGuestAccess(request))) {
    const url = request.nextUrl.clone();
    url.pathname = "/enter-password";
    url.searchParams.set("redirectTo", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Door 2: Supabase Auth, required only for the admin area, checked
  // only after door 1 has already passed.
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() re-validates the session against Supabase rather than just
  // trusting the cookie's contents, so a revoked/expired session is caught.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginRoute = pathname === "/admin/login";

  if (!user && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (user && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
