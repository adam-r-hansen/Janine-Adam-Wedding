import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// A Supabase client for use inside Server Components, Server Actions, and
// the admin layout — it reads the logged-in user's session from cookies,
// so queries run as that user (needed for the "authenticated write" RLS
// policies) instead of as an anonymous guest.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components can't write cookies. That's fine here because
          // middleware.ts already refreshes the session on every request.
        }
      },
    },
  });
}
