import { defineTool } from "@lovable.dev/mcp-js";
import { ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "patrol_overview",
  title: "Patrol overview",
  description: "Read the latest guard locations, statuses, incidents, and checkpoint activity visible to the signed-in user.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Sign in to SecurePatrol before using patrol monitoring.");
    const client = supabaseForUser(ctx);
    const [profiles, gps, incidents, logs, checkpoints] = await Promise.all([
      client.from("profiles").select("user_id,name,role,status,last_seen"),
      client.from("gps_tracking").select("guard_id,guard_name,lat,lng,status,is_moving,timestamp").order("timestamp", { ascending: false }).limit(100),
      client.from("incidents").select("id,guard_name,type,description,lat,lng,resolved,timestamp").order("timestamp", { ascending: false }).limit(50),
      client.from("patrol_logs").select("id,guard_name,checkpoint_name,timestamp,lat,lng").order("timestamp", { ascending: false }).limit(100),
      client.from("checkpoints").select("id,name,location,lat,lng,last_scanned,last_scanned_by"),
    ]);
    const firstError = [profiles, gps, incidents, logs, checkpoints].find((result) => result.error)?.error;
    if (firstError) throw new ToolError(firstError.message);
    return { content: [{ type: "text", text: JSON.stringify({ profiles: profiles.data ?? [], latestLocations: gps.data ?? [], incidents: incidents.data ?? [], patrolLogs: logs.data ?? [], checkpoints: checkpoints.data ?? [] }) }] };
  },
});