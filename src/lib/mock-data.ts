export interface User {
  uid: string;
  name: string;
  username: string;
  role: "guard" | "manager";
  status: "patrolling" | "idle" | "offline";
  lastSeen: string;
}

export interface PatrolLog {
  id: string;
  guardId: string;
  guardName: string;
  checkpointId: string;
  checkpointName: string;
  timestamp: string;
  lat: number;
  lng: number;
  synced: boolean;
}

export interface GPSTracking {
  guardId: string;
  guardName: string;
  lat: number;
  lng: number;
  timestamp: string;
  isMoving: boolean;
  status: "patrolling" | "idle" | "offline";
}

export interface Incident {
  id: string;
  guardId: string;
  guardName: string;
  type: "Fire" | "Theft" | "Medical" | "Other";
  description: string;
  lat: number;
  lng: number;
  timestamp: string;
  resolved: boolean;
}

export interface Checkpoint {
  id: string;
  name: string;
  location: string;
  lastScanned: string | null;
  lastScannedBy: string | null;
  lat: number;
  lng: number;
}

export interface Alert {
  id: string;
  message: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  timestamp: string;
  dismissed: boolean;
  type: "offline" | "idle" | "missed_checkpoint" | "incident";
}

export const DEMO_USERS: User[] = [
  { uid: "guard1", name: "Alex Rivera", username: "guard1", role: "guard", status: "patrolling", lastSeen: new Date().toISOString() },
  { uid: "guard2", name: "Sam Chen", username: "guard2", role: "guard", status: "idle", lastSeen: new Date(Date.now() - 300000).toISOString() },
  { uid: "guard3", name: "Jordan Blake", username: "guard3", role: "guard", status: "offline", lastSeen: new Date(Date.now() - 900000).toISOString() },
  { uid: "manager1", name: "Morgan Taylor", username: "manager", role: "manager", status: "patrolling", lastSeen: new Date().toISOString() },
];

export const DEMO_CREDENTIALS: Record<string, { password: string; uid: string }> = {
  guard1: { password: "guard123", uid: "guard1" },
  guard2: { password: "guard123", uid: "guard2" },
  manager: { password: "manager123", uid: "manager1" },
};

export const CHECKPOINTS: Checkpoint[] = [
  { id: "gate-a", name: "Gate A", location: "Main Entrance", lastScanned: new Date(Date.now() - 1800000).toISOString(), lastScannedBy: "Alex Rivera", lat: 40.7128, lng: -74.006 },
  { id: "gate-b", name: "Gate B", location: "East Wing", lastScanned: new Date(Date.now() - 3600000).toISOString(), lastScannedBy: "Sam Chen", lat: 40.7138, lng: -74.005 },
  { id: "server-room", name: "Server Room", location: "Building B, Floor 2", lastScanned: null, lastScannedBy: null, lat: 40.7118, lng: -74.007 },
  { id: "parking-north", name: "Parking Lot North", location: "North Campus", lastScanned: new Date(Date.now() - 7200000).toISOString(), lastScannedBy: "Alex Rivera", lat: 40.7148, lng: -74.004 },
  { id: "reception", name: "Reception Lobby", location: "Main Building", lastScanned: new Date(Date.now() - 900000).toISOString(), lastScannedBy: "Jordan Blake", lat: 40.7125, lng: -74.0065 },
  { id: "rooftop", name: "Rooftop", location: "Main Building Top", lastScanned: null, lastScannedBy: null, lat: 40.7132, lng: -74.0055 },
];

const now = Date.now();
export const DEMO_PATROL_LOGS: PatrolLog[] = [
  { id: "pl1", guardId: "guard1", guardName: "Alex Rivera", checkpointId: "gate-a", checkpointName: "Gate A", timestamp: new Date(now - 1800000).toISOString(), lat: 40.7128, lng: -74.006, synced: true },
  { id: "pl2", guardId: "guard1", guardName: "Alex Rivera", checkpointId: "parking-north", checkpointName: "Parking Lot North", timestamp: new Date(now - 3600000).toISOString(), lat: 40.7148, lng: -74.004, synced: true },
  { id: "pl3", guardId: "guard2", guardName: "Sam Chen", checkpointId: "gate-b", checkpointName: "Gate B", timestamp: new Date(now - 2400000).toISOString(), lat: 40.7138, lng: -74.005, synced: true },
  { id: "pl4", guardId: "guard1", guardName: "Alex Rivera", checkpointId: "reception", checkpointName: "Reception Lobby", timestamp: new Date(now - 5400000).toISOString(), lat: 40.7125, lng: -74.0065, synced: true },
  { id: "pl5", guardId: "guard3", guardName: "Jordan Blake", checkpointId: "reception", checkpointName: "Reception Lobby", timestamp: new Date(now - 900000).toISOString(), lat: 40.7125, lng: -74.0065, synced: true },
  { id: "pl6", guardId: "guard2", guardName: "Sam Chen", checkpointId: "gate-a", checkpointName: "Gate A", timestamp: new Date(now - 7200000).toISOString(), lat: 40.7128, lng: -74.006, synced: true },
  { id: "pl7", guardId: "guard1", guardName: "Alex Rivera", checkpointId: "server-room", checkpointName: "Server Room", timestamp: new Date(now - 9000000).toISOString(), lat: 40.7118, lng: -74.007, synced: true },
  { id: "pl8", guardId: "guard3", guardName: "Jordan Blake", checkpointId: "rooftop", checkpointName: "Rooftop", timestamp: new Date(now - 10800000).toISOString(), lat: 40.7132, lng: -74.0055, synced: true },
  { id: "pl9", guardId: "guard2", guardName: "Sam Chen", checkpointId: "parking-north", checkpointName: "Parking Lot North", timestamp: new Date(now - 12600000).toISOString(), lat: 40.7148, lng: -74.004, synced: true },
  { id: "pl10", guardId: "guard1", guardName: "Alex Rivera", checkpointId: "gate-b", checkpointName: "Gate B", timestamp: new Date(now - 14400000).toISOString(), lat: 40.7138, lng: -74.005, synced: true },
];

export const DEMO_GPS: GPSTracking[] = [
  { guardId: "guard1", guardName: "Alex Rivera", lat: 40.7130, lng: -74.0058, timestamp: new Date().toISOString(), isMoving: true, status: "patrolling" },
  { guardId: "guard2", guardName: "Sam Chen", lat: 40.7140, lng: -74.0048, timestamp: new Date(now - 300000).toISOString(), isMoving: false, status: "idle" },
  { guardId: "guard3", guardName: "Jordan Blake", lat: 40.7120, lng: -74.0068, timestamp: new Date(now - 900000).toISOString(), isMoving: false, status: "offline" },
];

export const DEMO_INCIDENTS: Incident[] = [
  { id: "inc1", guardId: "guard1", guardName: "Alex Rivera", type: "Theft", description: "Suspicious individual near parking lot. Attempted to break into vehicle.", lat: 40.7148, lng: -74.004, timestamp: new Date(now - 2700000).toISOString(), resolved: false },
  { id: "inc2", guardId: "guard2", guardName: "Sam Chen", type: "Other", description: "Broken window found at east wing entrance.", lat: 40.7138, lng: -74.005, timestamp: new Date(now - 5400000).toISOString(), resolved: true },
];

export const DEMO_ALERTS: Alert[] = [
  { id: "a1", message: "Guard Jordan Blake is offline since " + new Date(now - 900000).toLocaleTimeString(), severity: "HIGH", timestamp: new Date(now - 600000).toISOString(), dismissed: false, type: "offline" },
  { id: "a2", message: "Guard Sam Chen not moving since " + new Date(now - 300000).toLocaleTimeString(), severity: "MEDIUM", timestamp: new Date(now - 180000).toISOString(), dismissed: false, type: "idle" },
  { id: "a3", message: "Checkpoint Server Room not scanned in last 2 hours", severity: "MEDIUM", timestamp: new Date(now - 120000).toISOString(), dismissed: false, type: "missed_checkpoint" },
  { id: "a4", message: "INCIDENT: Theft reported by Alex Rivera at Parking Lot North", severity: "HIGH", timestamp: new Date(now - 2700000).toISOString(), dismissed: false, type: "incident" },
  { id: "a5", message: "Checkpoint Rooftop not scanned in last 2 hours", severity: "LOW", timestamp: new Date(now - 60000).toISOString(), dismissed: false, type: "missed_checkpoint" },
];
