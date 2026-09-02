import { auth, defineMcp } from "@lovable.dev/mcp-js";
import patrolOverview from "./tools/patrol-overview";
import activeAlerts from "./tools/active-alerts";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";
export default defineMcp({
  name: "securepatrol",
  title: "SecurePatrol",
  version: "1.0.0",
  instructions: "Authenticated monitoring tools for SecurePatrol guard patrols, live telemetry, checkpoints, incidents, and alerts.",
  auth: auth.oauth.issuer({ issuer: `https://${projectRef}.supabase.co/auth/v1`, acceptedAudiences: "authenticated" }),
  tools: [patrolOverview, activeAlerts],
});