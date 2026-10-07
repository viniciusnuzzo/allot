import assert from "node:assert/strict";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert(url && key, "Supabase URL and publishable key are required.");
assert(key.startsWith("sb_publishable_"), "Use a publishable key, never an administrative key.");
assert(new URL(url).protocol === "https:", "Supabase requires HTTPS.");

const response = await fetch(new URL("/auth/v1/settings", url), {
  headers: { apikey: key },
  signal: AbortSignal.timeout(15_000),
});
assert(response.ok, `Supabase Auth returned HTTP ${response.status}.`);
const data = await response.json();
assert(data && typeof data.external === "object", "Supabase returned invalid Auth settings.");
console.log("Supabase Auth: connected");
