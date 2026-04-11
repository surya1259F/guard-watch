import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { dataStore } from "@/lib/data-store";
import { toast } from "sonner";
import {
  Shield, LogOut, Map, ClipboardList, Bell, BarChart3, QrCode,
  Download, Printer, AlertTriangle, CheckCircle2, XCircle, Clock,
  Users, Scan, MapPin, FileText, X
} from "lucide-react";
import QRCode from "qrcode";

type ManagerTab = "map" | "logs" | "alerts" | "reports" | "qr";

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<ManagerTab>("map");
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    dataStore.getAlerts().then(a => setAlertCount(a.filter((x: any) => !x.dismissed).length));
    const unsub = dataStore.subscribeToTable("alerts", () => {
      dataStore.getAlerts().then(a => setAlertCount(a.filter((x: any) => !x.dismissed).length));
    });
    return unsub;
  }, []);

  if (!user) return null;

  const tabs = [
    { id: "map" as const, icon: Map, label: "Map" },
    { id: "logs" as const, icon: ClipboardList, label: "Logs" },
    { id: "alerts" as const, icon: Bell, label: "Alerts", badge: alertCount },
    { id: "reports" as const, icon: BarChart3, label: "Reports" },
    { id: "qr" as const, icon: QrCode, label: "QR Codes" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-bold">SecurePatrol</span>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Manager</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">{user.name}</span>
          <button onClick={logout} className="p-1.5 rounded-lg hover:bg-secondary transition">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <nav className="bg-card border-b border-border px-2 flex overflow-x-auto shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.badge ? (
              <span className="ml-1 bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto">
        {tab === "map" && <LiveMapTab />}
        {tab === "logs" && <PatrolLogsTab />}
        {tab === "alerts" && <AlertsTab />}
        {tab === "reports" && <ReportsTab />}
        {tab === "qr" && <QRCodesTab />}
      </main>
    </div>
  );
}

function LiveMapTab() {
  const [gpsData, setGpsData] = useState<any[]>([]);
  const [MapComponent, setMapComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    dataStore.getGPS().then(setGpsData);
    import("@/components/PatrolMap").then(mod => setMapComponent(() => mod.default));
    const unsub = dataStore.subscribeToTable("gps_tracking", () => dataStore.getGPS().then(setGpsData));
    return unsub;
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Live Guard Positions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {gpsData.map((g: any) => (
          <div key={g.guard_id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              g.status === "patrolling" ? "bg-patrol-green animate-pulse-green" :
              g.status === "idle" ? "bg-patrol-amber" : "bg-patrol-gray"
            }`} />
            <div>
              <p className="text-sm font-medium">{g.guard_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{g.status} · {new Date(g.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="h-[400px] rounded-xl overflow-hidden border border-border">
        {MapComponent ? <MapComponent /> : (
          <div className="w-full h-full bg-card flex items-center justify-center text-muted-foreground">
            <div className="text-center"><Map className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Loading map...</p></div>
          </div>
        )}
      </div>
    </div>
  );
}

function PatrolLogsTab() {
  const [guardFilter, setGuardFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    dataStore.getPatrolLogs().then(setLogs);
    const unsub = dataStore.subscribeToTable("patrol_logs", () => dataStore.getPatrolLogs().then(setLogs));
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((l: any) => {
      if (guardFilter && !l.guard_name.toLowerCase().includes(guardFilter.toLowerCase())) return false;
      if (dateFilter && !l.timestamp.startsWith(dateFilter)) return false;
      return true;
    });
  }, [logs, guardFilter, dateFilter]);

  const exportCSV = () => {
    const header = "Guard Name,Checkpoint,Time,Latitude,Longitude,Synced\n";
    const rows = filtered.map((l: any) => `${l.guard_name},${l.checkpoint_name},${new Date(l.timestamp).toLocaleString()},${l.lat},${l.lng},${l.synced}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `patrol_logs_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">Patrol Logs</h2>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <input value={guardFilter} onChange={e => setGuardFilter(e.target.value)} placeholder="Filter by guard..."
          className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Guard</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Checkpoint</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Time</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden sm:table-cell">GPS</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((l: any) => (
              <tr key={l.id} className="hover:bg-secondary/50">
                <td className="px-3 py-2 font-medium">{l.guard_name}</td>
                <td className="px-3 py-2">{l.checkpoint_name}</td>
                <td className="px-3 py-2 text-muted-foreground">{new Date(l.timestamp).toLocaleString()}</td>
                <td className="px-3 py-2 text-muted-foreground font-mono text-xs hidden sm:table-cell">{l.lat.toFixed(4)}, {l.lng.toFixed(4)}</td>
                <td className="px-3 py-2">
                  {l.synced ? <span className="text-xs text-patrol-green">✓ Synced</span> : <span className="text-xs text-patrol-amber">⏳ Pending</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AlertsTab() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    dataStore.getAlerts().then(setAlerts);
    const unsub = dataStore.subscribeToTable("alerts", () => dataStore.getAlerts().then(setAlerts));
    return unsub;
  }, []);

  const undismissed = alerts.filter((a: any) => !a.dismissed);

  const dismiss = async (id: string) => {
    await dataStore.dismissAlert(id);
    const updated = await dataStore.getAlerts();
    setAlerts(updated);
  };

  const severityStyles: Record<string, string> = {
    HIGH: "bg-patrol-red/10 border-patrol-red/30 text-patrol-red",
    MEDIUM: "bg-patrol-amber/10 border-patrol-amber/30 text-patrol-amber",
    LOW: "bg-muted border-border text-muted-foreground",
  };

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-bold">Alerts & Notifications</h2>
      <p className="text-sm text-muted-foreground">{undismissed.length} active alerts</p>
      {undismissed.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">All clear — no active alerts</p>
        </div>
      ) : (
        <div className="space-y-2">
          {undismissed.map((a: any) => (
            <div key={a.id} className={`flex items-start gap-3 p-3 rounded-lg border ${severityStyles[a.severity] || severityStyles.LOW}`}>
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold">{a.severity}</span>
                  <span className="text-xs opacity-70">{new Date(a.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm">{a.message}</p>
              </div>
              <button onClick={() => dismiss(a.id)} className="p-1 hover:opacity-70"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [gps, setGps] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      dataStore.getPatrolLogs(),
      dataStore.getGPS(),
      dataStore.getIncidents(),
      dataStore.getCheckpoints(),
    ]).then(([l, g, i, c]) => { setLogs(l); setGps(g); setIncidents(i); setCheckpoints(c); });
  }, []);

  const today = new Date().toDateString();
  const todayLogs = logs.filter((l: any) => new Date(l.timestamp).toDateString() === today);
  const activeGuards = gps.filter((g: any) => g.status !== "offline").length;
  const coveredCheckpoints = new Set(todayLogs.map((l: any) => l.checkpoint_id)).size;
  const missedCheckpoints = checkpoints.filter((cp: any) => {
    if (!cp.last_scanned) return true;
    return Date.now() - new Date(cp.last_scanned).getTime() > 4 * 3600000;
  });

  const guardBreakdown = useMemo(() => {
    const guards = [...new Set(logs.map((l: any) => l.guard_id))];
    return guards.map(gId => {
      const guardLogs = logs.filter((l: any) => l.guard_id === gId);
      const guardTodayLogs = todayLogs.filter((l: any) => l.guard_id === gId);
      const gpsEntry = gps.find((g: any) => g.guard_id === gId);
      return {
        name: guardLogs[0]?.guard_name || gId,
        scansToday: guardTodayLogs.length,
        lastActive: gpsEntry?.timestamp || guardLogs[0]?.timestamp || "N/A",
        checkpointsHit: new Set(guardTodayLogs.map((l: any) => l.checkpoint_id)).size,
        status: gpsEntry?.status || "offline",
      };
    });
  }, [logs, todayLogs, gps]);

  const downloadPDF = () => {
    import("jspdf").then(({ default: jsPDF }) => {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("SecurePatrol - Patrol Report", 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      doc.setFontSize(12);
      doc.text(`Total Scans Today: ${todayLogs.length}`, 14, 42);
      doc.text(`Active Guards: ${activeGuards}`, 14, 50);
      doc.text(`Checkpoints Covered: ${coveredCheckpoints} / ${checkpoints.length}`, 14, 58);
      doc.text(`Incidents: ${incidents.length}`, 14, 66);
      doc.setFontSize(14);
      doc.text("Guard Breakdown", 14, 82);
      let y = 90;
      guardBreakdown.forEach(g => {
        doc.setFontSize(10);
        doc.text(`${g.name} — ${g.scansToday} scans, ${g.checkpointsHit} checkpoints, ${g.status}`, 14, y);
        y += 8;
      });
      if (missedCheckpoints.length > 0) {
        y += 10;
        doc.setFontSize(14);
        doc.text("Missed Checkpoints (4h+)", 14, y);
        y += 8;
        missedCheckpoints.forEach((cp: any) => {
          doc.setFontSize(10);
          doc.text(`${cp.name} — ${cp.location}`, 14, y);
          y += 8;
        });
      }
      doc.save(`patrol_report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF report downloaded");
    });
  };

  const cards = [
    { label: "Scans Today", value: todayLogs.length, icon: Scan, color: "text-primary" },
    { label: "Guards Active", value: activeGuards, icon: Users, color: "text-patrol-green" },
    { label: "Checkpoints Hit", value: `${coveredCheckpoints}/${checkpoints.length}`, icon: MapPin, color: "text-patrol-blue" },
    { label: "Incidents", value: incidents.filter((i: any) => !i.resolved).length, icon: AlertTriangle, color: "text-patrol-red" },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">Reports</h2>
        <button onClick={downloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition">
          <FileText className="w-4 h-4" /> Download PDF
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className="bg-card border border-border rounded-lg p-4">
            <c.icon className={`w-5 h-5 ${c.color} mb-2`} />
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <h3 className="font-semibold mt-2">Guard Breakdown</h3>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Guard</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Scans</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden sm:table-cell">Last Active</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">CPs Hit</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {guardBreakdown.map(g => (
              <tr key={g.name}>
                <td className="px-3 py-2 font-medium">{g.name}</td>
                <td className="px-3 py-2">{g.scansToday}</td>
                <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{g.lastActive !== "N/A" ? new Date(g.lastActive).toLocaleTimeString() : "N/A"}</td>
                <td className="px-3 py-2">{g.checkpointsHit}</td>
                <td className="px-3 py-2 capitalize">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    g.status === "patrolling" ? "bg-patrol-green/10 text-patrol-green" :
                    g.status === "idle" ? "bg-patrol-amber/10 text-patrol-amber" : "bg-muted text-muted-foreground"
                  }`}>{g.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {missedCheckpoints.length > 0 && (
        <>
          <h3 className="font-semibold text-patrol-red">Missed Checkpoints (4h+)</h3>
          <div className="space-y-2">
            {missedCheckpoints.map((cp: any) => (
              <div key={cp.id} className="bg-patrol-red/5 border border-patrol-red/20 rounded-lg p-3 flex items-center gap-3">
                <XCircle className="w-5 h-5 text-patrol-red shrink-0" />
                <div>
                  <p className="text-sm font-medium">{cp.name}</p>
                  <p className="text-xs text-muted-foreground">{cp.location} · Last: {cp.last_scanned ? new Date(cp.last_scanned).toLocaleString() : "Never"}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function QRCodesTab() {
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [checkpoints, setCheckpoints] = useState<any[]>([]);

  useEffect(() => {
    dataStore.getCheckpoints().then(cps => {
      setCheckpoints(cps);
      cps.forEach((cp: any) => {
        const data = JSON.stringify({ id: cp.id, name: cp.name, location: cp.location });
        QRCode.toDataURL(data, { width: 200, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } })
          .then(url => setQrImages(prev => ({ ...prev, [cp.id]: url })));
      });
    });
  }, []);

  const printAll = () => window.print();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 no-print">
        <h2 className="text-lg font-bold">QR Code Generator</h2>
        <button onClick={printAll} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition">
          <Printer className="w-4 h-4" /> Print All
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {checkpoints.map((cp: any) => (
          <div key={cp.id} className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center">
            {qrImages[cp.id] ? (
              <img src={qrImages[cp.id]} alt={cp.name} className="w-40 h-40 rounded-lg mb-3" />
            ) : (
              <div className="w-40 h-40 bg-secondary rounded-lg mb-3 animate-pulse" />
            )}
            <h3 className="font-bold text-sm">{cp.name}</h3>
            <p className="text-xs text-muted-foreground">{cp.location}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">ID: {cp.id}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
