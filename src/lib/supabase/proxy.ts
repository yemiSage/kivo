import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

const PUBLIC_PATHS = [
	"/login",
	"/auth",
	"/offline",
	"/share-target",
	"/icons",
	"/api/health",
];

export async function updateSession(request: NextRequest) {
	let response = NextResponse.next({ request });

	// A static, account-free launch screen must not wait for an Auth round trip.
	// The library it navigates to still runs the normal auth gate and RLS checks.
	if (request.nextUrl.pathname === "/launch" || request.nextUrl.pathname === "/welcome" || request.nextUrl.pathname.startsWith("/welcome/")) return response;

	if (!env.configured) return response;

	const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
		cookies: {
			getAll: () => request.cookies.getAll(),
			setAll: (toSet) => {
				toSet.forEach(({ name, value }) => request.cookies.set(name, value));
				response = NextResponse.next({ request });
				toSet.forEach(({ name, value, options }) =>
					response.cookies.set(name, value, options),
				);
			},
		},
	});

	// Verify the JWT and refresh if needed. Asymmetric keys use cached JWKS;
	// legacy symmetric keys are still verified by the Auth server.
	const { data, error } = await supabase.auth.getClaims();
	const { pathname, search } = request.nextUrl;

	if (
		(error || !data?.claims?.sub) &&
		!PUBLIC_PATHS.some((p) => pathname.startsWith(p)) &&
		!pathname.startsWith("/api")
	) {
		const url = request.nextUrl.clone();
		if (pathname === "/" && !search) {
			url.pathname = "/welcome";
			const redirect = NextResponse.redirect(url);
			response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
			return redirect;
		}
		url.pathname = "/login";
		// Preserve shared content through the sign-in detour.
		url.search = `?next=${encodeURIComponent(pathname + search)}`;
		const redirect = NextResponse.redirect(url);
		response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
		return redirect;
	}

	return response;
}
