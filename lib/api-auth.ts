import { getSupabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export type ApiSession = {
  company_id: string;
  key_id: string;
};

export async function verifyApiKey(req: NextRequest): Promise<ApiSession | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const rawKey = authHeader.slice(7);
  if (!rawKey.startsWith("sc_")) return null;

  const prefix = rawKey.slice(0, 16); // "sc_live_" + first 8 chars

  const supabase = getSupabase();
  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, key_hash, company_id")
    .eq("key_prefix", prefix)
    .is("revoked_at", null);

  if (!keys || keys.length === 0) return null;

  for (const key of keys) {
    const match = await bcrypt.compare(rawKey, key.key_hash);
    if (match) {
      // Update last_used_at
      await supabase
        .from("api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", key.id);
      return { company_id: key.company_id, key_id: key.id };
    }
  }
  return null;
}
