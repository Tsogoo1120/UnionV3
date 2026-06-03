import { createClient } from "@supabase/supabase-js";

let adminClient = null;

export function getAdminClient() {
  if (adminClient) return adminClient;
  adminClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  return adminClient;
}

export async function getUserFromToken(token) {
  const supabase = getAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function getProfile(userId) {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("role, subscription_status, subscription_expires_at")
    .eq("id", userId)
    .single();
  return data;
}

export function canAccessSubscriberContent(profile) {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  if (profile.subscription_status === "active") {
    if (!profile.subscription_expires_at) return true;
    return new Date(profile.subscription_expires_at) > new Date();
  }
  return false;
}
