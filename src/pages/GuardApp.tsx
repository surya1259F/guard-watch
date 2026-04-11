import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { dataStore } from "@/lib/data-store";
import { CHECKPOINTS, type PatrolLog, type Incident } from "@/lib/mock-data";
import { toast } from "sonner";
import {
  QrCode, ClipboardList, AlertTriangle, LogOut, Shield, Wifi, WifiOff,
  MapPin, Clock, Send, Camera, CheckCircle2, Circle
} from "lucide-react";

type GuardTab = "scan" | "log" | "report";

export default function GuardApp() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<GuardTab>("scan");
  const [pendingCount, setPendingCount] = useState(0);
  const [guardStatus, setGuardStatus] = useState<"patrolling" | "idle" | "offline">("patrolling");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); const synced = dataStore.syncPendingScans(); if (synced > 0) toast.success(`${synced} pending scans synced`); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setPendingCount(dataStore.getPendingScans().length);
    return () => { window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, []);

  // GPS tracking simulation
  useEffect(() => {
    if (!user) return;
    let lastLat = 40.713 + (Math.random() - 0.5) * 0.005;
    let lastLng = -74.006 + (Math.random() - 0.5) * 0.005;
    const interval = setInterval(() => {
      const moving = Math.random() > 0.3;
      if (moving) { lastLat += (Math.random() - 0.5) * 0.001; lastLng += (Math.random() - 0.5) * 0.001; }
      setGuardStatus(moving ? "patrolling" : "idle");
      dataStore.updateGPS({ guardId: user.uid, guardName: user.name, lat: lastLat, lng: lastLng, timestamp: new Date().toISOString(), isMoving: moving, status: moving ? "patrolling" : "idle" });
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm">SecurePatrol</span>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={guardStatus} />
          {pendingCount > 0 && (
            <span className="text-xs bg-patrol-amber/20 text-patrol-amber px-2 py-0.5 rounded-full font-medium">
              {pendingCount} pending
            </span>
          )}
          {isOnline ? <Wifi className="w-4 h-4 text-primary" /> : <WifiOff className="w-4 h-4 text-patrol-red" />}
          <button onClick={logout} className="p-1.5 rounded-lg hover:bg-secondary transition">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {tab === "scan" && <ScanTab user={user} isOnline={isOnline} onScan={() => setPendingCount(dataStore.getPendingScans().length)} />}
        {tab === "log" && <LogTab guardId={user.uid} />}
        {tab === "report" && <ReportTab user={user} />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex">
        {([
          { id: "scan" as const, icon: QrCode, label: "Scan" },
          { id: "log" as const, icon: ClipboardList, label: "My Log" },
          { id: "report" as const, icon: AlertTriangle, label: "Report" },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition ${tab === t.id ? "text-primary" : "text-muted-foreground"}`}
          >
            <t.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    patrolling: { color: "bg-patrol-green", text: "Patrolling", emoji: "🟢" },
    idle: { color: "bg-patrol-amber", text: "Idle", emoji: "🔴" },
    offline: { color: "bg-patrol-gray", text: "Offline", emoji: "⚪" },
  }[status] || { color: "bg-patrol-gray", text: "Unknown", emoji: "⚪" };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}/20 text-foreground`}>
      {config.emoji} {config.text}
    </span>
  );
}

function ScanTab({ user, isOnline, onScan }: { user: any; isOnline: boolean; onScan: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const simulateScan = () => {
    const cp = CHECKPOINTS[Math.floor(Math.random() * CHECKPOINTS.length)];
    const log: PatrolLog = {
      id: "pl" + Date.now(),
      guardId: user.uid,
      guardName: user.name,
      checkpointId: cp.id,
      checkpointName: cp.name,
      timestamp: new Date().toISOString(),
      lat: cp.lat + (Math.random() - 0.5) * 0.001,
      lng: cp.lng + (Math.random() - 0.5) * 0.001,
      synced: isOnline,
    };
    if (isOnline) {
      dataStore.addPatrolLog(log);
    } else {
      dataStore.addPendingScan(log);
    }
    setLastScan(`${cp.name} at ${new Date().toLocaleTimeString()}`);
    toast.success(`${cp.name} logged at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    onScan();
    stopCamera();
  };

  const startCamera = async () => {
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      // In demo mode, auto-scan after 2 seconds
      setTimeout(simulateScan, 2000);
    } catch {
      // Camera not available, simulate directly
      setTimeout(simulateScan, 1000);
    }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">QR Code Scanner</h2>

      {scanning ? (
        <div className="relative rounded-xl overflow-hidden bg-secondary aspect-square max-w-sm mx-auto border-2 border-primary/30">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-primary rounded-2xl animate-pulse" />
          </div>
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <span className="text-xs bg-card/80 text-foreground px-3 py-1 rounded-full">Scanning... (demo auto-scan)</span>
          </div>
          <button onClick={stopCamera} className="absolute top-3 right-3 bg-card/80 p-2 rounded-lg">
            <span className="text-xs font-medium">Cancel</span>
          </button>
        </div>
      ) : (
        <button
          onClick={startCamera}
          className="w-full max-w-sm mx-auto flex flex-col items-center gap-3 p-8 bg-card border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <span className="font-semibold">Tap to Scan Checkpoint</span>
          <span className="text-xs text-muted-foreground">Point camera at QR code</span>
        </button>
      )}

      {lastScan && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg max-w-sm mx-auto">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
          <span className="text-sm">Last scan: {lastScan}</span>
        </div>
      )}

      {!isOnline && (
        <div className="flex items-center gap-2 p-3 bg-patrol-amber/10 border border-patrol-amber/20 rounded-lg max-w-sm mx-auto">
          <WifiOff className="w-4 h-4 text-patrol-amber" />
          <span className="text-xs text-patrol-amber">Offline — scans will sync when reconnected</span>
        </div>
      )}
    </div>
  );
}

function LogTab({ guardId }: { guardId: string }) {
  const logs = dataStore.getPatrolLogs().filter(l => l.guardId === guardId);
  const today = new Date().toDateString();
  const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === today);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-bold">Today's Patrol Log</h2>
      <p className="text-sm text-muted-foreground">{todayLogs.length} checkpoints scanned today</p>
      {todayLogs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No scans recorded today</p>
        </div>
      ) : (
        <div className="space-y-2">
          {todayLogs.map(log => (
            <div key={log.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{log.checkpointName}</p>
                <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</p>
              </div>
              {log.synced ? (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-patrol-amber shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportTab({ user }: { user: any }) {
  const [type, setType] = useState<Incident["type"]>("Other");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      const incident: Incident = {
        id: "inc" + Date.now(),
        guardId: user.uid,
        guardName: user.name,
        type,
        description,
        lat: 40.713 + (Math.random() - 0.5) * 0.005,
        lng: -74.006 + (Math.random() - 0.5) * 0.005,
        timestamp: new Date().toISOString(),
        resolved: false,
      };
      dataStore.addIncident(incident);
      toast.success("Incident reported successfully");
      setDescription("");
      setSubmitting(false);
    }, 500);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Report Incident</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Incident Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as Incident["type"])}
            className="w-full py-2.5 px-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="Fire">🔥 Fire</option>
            <option value="Theft">🚨 Theft</option>
            <option value="Medical">🏥 Medical</option>
            <option value="Other">📋 Other</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="w-full py-2.5 px-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            placeholder="Describe the incident..."
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !description.trim()}
          className="w-full py-2.5 bg-destructive text-destructive-foreground font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          {submitting ? "Sending..." : "Send Report"}
        </button>
      </form>
    </div>
  );
}
