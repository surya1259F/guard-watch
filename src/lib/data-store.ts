import {
  type PatrolLog, type GPSTracking, type Incident, type Alert, type Checkpoint,
  DEMO_PATROL_LOGS, DEMO_GPS, DEMO_INCIDENTS, DEMO_ALERTS, CHECKPOINTS,
} from "./mock-data";

const STORAGE_KEYS = {
  patrolLogs: "sp_patrol_logs",
  gps: "sp_gps",
  incidents: "sp_incidents",
  alerts: "sp_alerts",
  checkpoints: "sp_checkpoints",
  pendingScans: "sp_pending_scans",
};

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Initialize data on first load
function init() {
  if (!localStorage.getItem(STORAGE_KEYS.patrolLogs)) save(STORAGE_KEYS.patrolLogs, DEMO_PATROL_LOGS);
  if (!localStorage.getItem(STORAGE_KEYS.gps)) save(STORAGE_KEYS.gps, DEMO_GPS);
  if (!localStorage.getItem(STORAGE_KEYS.incidents)) save(STORAGE_KEYS.incidents, DEMO_INCIDENTS);
  if (!localStorage.getItem(STORAGE_KEYS.alerts)) save(STORAGE_KEYS.alerts, DEMO_ALERTS);
  if (!localStorage.getItem(STORAGE_KEYS.checkpoints)) save(STORAGE_KEYS.checkpoints, CHECKPOINTS);
}
init();

export const dataStore = {
  getPatrolLogs: (): PatrolLog[] => load(STORAGE_KEYS.patrolLogs, DEMO_PATROL_LOGS),
  addPatrolLog: (log: PatrolLog) => {
    const logs = dataStore.getPatrolLogs();
    logs.unshift(log);
    save(STORAGE_KEYS.patrolLogs, logs);
    // Update checkpoint
    const cps = dataStore.getCheckpoints();
    const cp = cps.find(c => c.id === log.checkpointId);
    if (cp) { cp.lastScanned = log.timestamp; cp.lastScannedBy = log.guardName; }
    save(STORAGE_KEYS.checkpoints, cps);
  },

  getGPS: (): GPSTracking[] => load(STORAGE_KEYS.gps, DEMO_GPS),
  updateGPS: (entry: GPSTracking) => {
    const gps = dataStore.getGPS();
    const idx = gps.findIndex(g => g.guardId === entry.guardId);
    if (idx >= 0) gps[idx] = entry; else gps.push(entry);
    save(STORAGE_KEYS.gps, gps);
  },

  getIncidents: (): Incident[] => load(STORAGE_KEYS.incidents, DEMO_INCIDENTS),
  addIncident: (inc: Incident) => {
    const incidents = dataStore.getIncidents();
    incidents.unshift(inc);
    save(STORAGE_KEYS.incidents, incidents);
    // Auto-generate alert
    const alert: Alert = {
      id: "a" + Date.now(),
      message: `INCIDENT: ${inc.type} reported by ${inc.guardName} at (${inc.lat.toFixed(4)}, ${inc.lng.toFixed(4)})`,
      severity: "HIGH",
      timestamp: new Date().toISOString(),
      dismissed: false,
      type: "incident",
    };
    dataStore.addAlert(alert);
  },

  getAlerts: (): Alert[] => load(STORAGE_KEYS.alerts, DEMO_ALERTS),
  addAlert: (alert: Alert) => {
    const alerts = dataStore.getAlerts();
    alerts.unshift(alert);
    save(STORAGE_KEYS.alerts, alerts);
  },
  dismissAlert: (id: string) => {
    const alerts = dataStore.getAlerts();
    const a = alerts.find(a => a.id === id);
    if (a) a.dismissed = true;
    save(STORAGE_KEYS.alerts, alerts);
  },

  getCheckpoints: (): Checkpoint[] => load(STORAGE_KEYS.checkpoints, CHECKPOINTS),

  // Pending scans (offline queue)
  getPendingScans: (): PatrolLog[] => load(STORAGE_KEYS.pendingScans, []),
  addPendingScan: (log: PatrolLog) => {
    const pending = dataStore.getPendingScans();
    pending.push(log);
    save(STORAGE_KEYS.pendingScans, pending);
  },
  syncPendingScans: () => {
    const pending = dataStore.getPendingScans();
    pending.forEach(log => { log.synced = true; dataStore.addPatrolLog(log); });
    save(STORAGE_KEYS.pendingScans, []);
    return pending.length;
  },
  clearPendingScans: () => save(STORAGE_KEYS.pendingScans, []),
};
