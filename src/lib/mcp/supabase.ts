import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

type RuntimeGlobals = typeof globalThis & { Deno?: { env?: { get?: (name: string) => string | undefined } }; process?: { env?: Record<string, string | undefined> } };
function env(name: string) { const runtime = globalThis as RuntimeGlobals; return runtime.Deno?.env?.get?.(name) ?? runtime.process?.env?.[name]; }
function configured(names: readonly string[]) { return names.map((name) => env(name)?.trim()).find(Boolean); }
function url() { const value = configured(["SUPABASE_URL", "VITE_SUPABASE_URL"]); if (!value) throw new Error("Backend URL is not configured"); return value; }
function key() { const direct = configured(["SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"]); if (direct) return direct; const raw = env("SUPABASE_PUBLISHABLE_KEYS"); if (raw) { try { const values = Object.values(JSON.parse(raw) as Record<string, unknown>); const found = values.find((value): value is string => typeof value === "string" && value.trim().length > 10); if (found) return found; } catch { /* try the legacy names above */ } } throw new Error("Backend publishable key is not configured"); }
export function supabaseForUser(ctx: ToolContext) { const token = ctx.getToken(); if (!token) throw new Error("A signed-in agent connection is required."); return createClient(url(), key(), { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } }); }