import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// A Supabase client for use inside Client Components (login form,
// sign-out button). It stores the session in cookies rather than
// localStorage, so the server-side client above can see the same
// logged-in session.
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
