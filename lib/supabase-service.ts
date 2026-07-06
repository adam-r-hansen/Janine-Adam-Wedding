import "server-only";
import { createClient } from "@supabase/supabase-js";

// SERVICE ROLE client — bypasses Row Level Security entirely. This is the
// only way the public RSVP flow can read/write the admin-only `parties`
// and `guests` tables without changing their RLS policies.
//
// The `import "server-only"` line above makes the build itself fail if
// this file is ever imported into a Client Component, so
// SUPABASE_SERVICE_ROLE_KEY can never end up in a browser bundle.
//
// Only ever call this from the tightly-scoped functions in
// app/rsvp/actions.ts — never add a generic "run any query" helper on
// top of it.
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
