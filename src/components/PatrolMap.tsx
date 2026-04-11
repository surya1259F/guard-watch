import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { dataStore } from "@/lib/data-store";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function createIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid rgba(255,255,255,0.8);box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const icons = {
  patrolling: createIcon("#22c55e"),
  idle: createIcon("#f59e0b"),
  offline: createIcon("#6b7280"),
};

export default function PatrolMap() {
  const gpsData = dataStore.getGPS();
  const logs = dataStore.getPatrolLogs();

  return (
    <MapContainer
      center={[40.7128, -74.006]}
      zoom={15}
      className="w-full h-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {gpsData.map(g => {
        const lastLog = logs.find(l => l.guardId === g.guardId);
        return (
          <Marker key={g.guardId} position={[g.lat, g.lng]} icon={icons[g.status] || icons.offline}>
            <Popup>
              <div className="text-sm space-y-1">
                <p className="font-bold">{g.guardName}</p>
                <p>Status: <span className="capitalize">{g.status}</span></p>
                <p>Last seen: {new Date(g.timestamp).toLocaleTimeString()}</p>
                {lastLog && <p>Last checkpoint: {lastLog.checkpointName}</p>}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
