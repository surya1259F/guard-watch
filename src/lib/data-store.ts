import { supabase } from "@/integrations/supabase/client";

// Pending scans stored locally for offline mode
const PENDING_KEY = "sp_pending_scans";

interface PendingScan {
  id: string;
  guard_id: string;
  guard_name: string;
  checkpoint_id: string;
  checkpoint_name: string;
  timestamp: string;
  lat: number;
  lng: number;
}

function loadPending(): PendingScan[] {
  try {
    const d = localStorage.getItem(PENDING_KEY);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
}

function savePending(data: PendingScan[]) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(data));
}

export const dataStore = {
  // Patrol Logs
  getPatrolLogs: async () => {
    const { data } = await supabase.from("patrol_logs").select("*").order("timestamp", { ascending: false });
    return data || [];
  },

  addPatrolLog: async (log: {
    id: string; guard_id: string; guard_name: string;
    checkpoint_id: string; checkpoint_name: string;
    timestamp: string; lat: number; lng: number; synced: boolean;
  }) => {
    await supabase.from("patrol_logs").insert(log);
    // Update checkpoint last_scanned
    await supabase.from("checkpoints").update({
      last_scanned: log.timestamp,
      last_scanned_by: log.guard_name,
    }).eq("id", log.checkpoint_id);
  },

  // GPS
  getGPS: async () => {
    const { data } = await supabase.from("gps_tracking").select("*");
    return data || [];
  },

  updateGPS: async (entry: {
    guard_id: string; guard_name: string; lat: number; lng: number;
    timestamp: string; is_moving: boolean; status: string;
  }) => {
    const { data: existing } = await supabase.from("gps_tracking")
      .select("id").eq("guard_id", entry.guard_id).maybeSingle();
    if (existing) {
      await supabase.from("gps_tracking").update(entry).eq("guard_id", entry.guard_id);
    } else {
      await supabase.from("gps_tracking").insert(entry);
    }
  },

  // Incidents
  getIncidents: async () => {
    const { data } = await supabase.from("incidents").select("*").order("timestamp", { ascending: false });
    return data || [];
  },

  addIncident: async (inc: {
    id: string; guard_id: string; guard_name: string; type: string;
    description: string; lat: number; lng: number; timestamp: string; resolved: boolean;
  }) => {
    await supabase.from("incidents").insert(inc);
    // Auto-generate alert
    await supabase.from("alerts").insert({
      id: "a" + Date.now(),
      message: `INCIDENT: ${inc.type} reported by ${inc.guard_name} at (${inc.lat.toFixed(4)}, ${inc.lng.toFixed(4)})`,
      severity: "HIGH",
      timestamp: new Date().toISOString(),
      dismissed: false,
      type: "incident",
    });
  },

  // Alerts
  getAlerts: async () => {
    const { data } = await supabase.from("alerts").select("*").order("timestamp", { ascending: false });
    return data || [];
  },

  addAlert: async (alert: { id: string; message: string; severity: string; timestamp: string; dismissed: boolean; type: string }) => {
    await supabase.from("alerts").insert(alert);
  },

  dismissAlert: async (id: string) => {
    await supabase.from("alerts").update({ dismissed: true }).eq("id", id);
  },

  // Checkpoints
  getCheckpoints: async () => {
    const { data } = await supabase.from("checkpoints").select("*");
    return data || [];
  },

  // Pending scans (offline queue - stays in localStorage)
  getPendingScans: (): PendingScan[] => loadPending(),

  addPendingScan: (log: PendingScan) => {
    const pending = loadPending();
    pending.push(log);
    savePending(pending);
  },

  syncPendingScans: async () => {
    const pending = loadPending();
    for (const log of pending) {
      await dataStore.addPatrolLog({ ...log, synced: true });
    }
    savePending([]);
    return pending.length;
  },

  clearPendingScans: () => savePending([]),

  // Real-time subscriptions
  subscribeToTable: (table: string, callback: () => void) => {
    const channel = supabase.channel(`${table}_changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },
};
