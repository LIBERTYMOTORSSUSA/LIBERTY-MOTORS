
// LIBERTY MOTORS — SUPABASE CONNECTION

const SUPABASE_URL = "https://cgjigaelmffogjmxlyzd.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_P4AlUbopBNpNGGRw6d1BYw_k89yTIgP";

window.libertySupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
