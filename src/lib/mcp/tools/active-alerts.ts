import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "active_alerts",
  title: "Active alerts",
  description: "List unresolved SecurePatrol alerts for the signed-in user.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Sign in to SecurePatrol before using alert monitoring.");
    const { data, error } = await supabaseForUser(ctx).from("alerts").select("id,message,severity,type,timestamp,dismissed").eq("dismissed", false).order("timestamp", { ascending: false }).limit(50);
    if (error) throw new ToolError(error.message);
    return { content: [{ type: "text", text: JSON.stringify(data ?? []) }] };
  },
});