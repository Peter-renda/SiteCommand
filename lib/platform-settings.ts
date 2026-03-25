import { getSupabase } from "@/lib/supabase";

/**
 * Returns the value of a platform setting, first checking the database
 * (platform_settings table) and falling back to the environment variable
 * of the same name when no DB row exists.
 *
 * This allows credentials to be configured at runtime through the admin UI
 * without requiring a redeploy, while still supporting the traditional
 * env-var approach for self-hosted / CI environments.
 */
export async function getPlatformSetting(key: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (data?.value) return data.value;

  // Fall back to environment variable
  return process.env[key] ?? null;
}

/**
 * Returns the APS client ID and secret, resolving from the DB or env vars.
 * Returns null for either field if not configured.
 */
export async function getApsCredentials(): Promise<{
  clientId: string | null;
  clientSecret: string | null;
}> {
  const [clientId, clientSecret] = await Promise.all([
    getPlatformSetting("APS_CLIENT_ID"),
    getPlatformSetting("APS_CLIENT_SECRET"),
  ]);
  return { clientId, clientSecret };
}
