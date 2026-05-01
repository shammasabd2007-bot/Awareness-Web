/**
 * LeafletMap — Real interactive map using OpenStreetMap + Leaflet.js
 *
 * • No API key required (OpenStreetMap is free & open)
 * • On web  → renders an <iframe> with inline Leaflet HTML
 * • On native → renders via expo-web-view (falls back to coordinate display)
 * • Default view: India (lat 20.5937, lng 78.9629, zoom 5)
 * • Markers are colour-coded: 🔴 not_visited  🟡 in_progress  🟢 completed
 * • Clicking a marker fires onMarkerPress(location)
 * • Clicking the map fires onMapPress({ latitude, longitude })
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface MapLocation {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  status: 'not_visited' | 'in_progress' | 'completed';
  category?: string;
}

interface LeafletMapProps {
  locations?: MapLocation[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  height?: number;
  onMarkerPress?: (location: MapLocation) => void;
  onMapPress?: (coords: { latitude: number; longitude: number }) => void;
  showUserLocation?: boolean;
}

// ─── Colour helper ────────────────────────────────────────────────────────────
const markerColor = (status: string) => {
  if (status === 'completed') return '#4CAF50';
  if (status === 'in_progress') return '#FFC107';
  return '#F44336';
};

// ─── Build the full Leaflet HTML page ─────────────────────────────────────────
const buildLeafletHTML = (
  locations: MapLocation[],
  centerLat: number,
  centerLng: number,
  zoom: number,
  showUserLocation: boolean
): string => {
  const markersJS = locations
    .map((loc) => {
      const color = markerColor(loc.status);
      const label =
        loc.status === 'completed'
          ? '✅ Completed'
          : loc.status === 'in_progress'
          ? '🔄 In Progress'
          : '🔴 Not Visited';

      return `
        (function(){
          var icon = L.divIcon({
            className: '',
            html: '<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
            iconSize:[18,18],
            iconAnchor:[9,9],
            popupAnchor:[0,-12]
          });
          var m = L.marker([${loc.latitude}, ${loc.longitude}], {icon:icon}).addTo(map);
          m.bindPopup(
            '<div style="font-family:sans-serif;min-width:160px">' +
            '<b style="font-size:14px">${loc.title.replace(/'/g, "\\'")}</b><br>' +
            '<span style="font-size:12px;color:#666">${(loc.category || '').replace(/'/g, "\\'")}</span><br>' +
            '<span style="font-size:12px;margin-top:4px;display:block">${label}</span>' +
            '<hr style="margin:6px 0">' +
            '<span style="font-size:11px;color:#999">${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}</span>' +
            '</div>'
          );
          m.on('click', function(){
            window.parent.postMessage(JSON.stringify({type:'markerPress',id:'${loc.id}'}), '*');
          });
        })();
      `;
    })
    .join('\n');

  const userLocJS = showUserLocation
    ? `
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos){
          var ul = L.circleMarker([pos.coords.latitude, pos.coords.longitude], {
            radius: 8, fillColor: '#1976D2', color: '#fff',
            weight: 2, opacity: 1, fillOpacity: 0.9
          }).addTo(map);
          ul.bindPopup('<b>📍 Your Location</b>');
        });
      }
    `
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; }
    .leaflet-popup-content-wrapper { border-radius:10px; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', {
    center: [${centerLat}, ${centerLng}],
    zoom: ${zoom},
    zoomControl: true,
    attributionControl: true
  });

  /* OpenStreetMap tile layer — free, no API key */
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  /* India boundary highlight (approximate bounding box) */
  var indiaBounds = [[8.0, 68.0],[37.5, 97.5]];
  L.rectangle(indiaBounds, {
    color: '#2E7D32', weight: 1.5,
    fill: false, dashArray: '6,4', opacity: 0.5
  }).addTo(map);

  /* Markers */
  ${markersJS}

  /* User location */
  ${userLocJS}

  /* Map click → send coords to React */
  map.on('click', function(e){
    window.parent.postMessage(
      JSON.stringify({type:'mapPress', lat:e.latlng.lat, lng:e.latlng.lng}), '*'
    );
  });
</script>
</body>
</html>`;
};

// ─── Web component (iframe) ───────────────────────────────────────────────────
const LeafletMapWeb: React.FC<LeafletMapProps> = ({
  locations = [],
  centerLat = 20.5937,
  centerLng = 78.9629,
  zoom = 5,
  height = 340,
  onMarkerPress,
  onMapPress,
  showUserLocation = true,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const html = buildLeafletHTML(
    locations,
    centerLat,
    centerLng,
    zoom,
    showUserLocation
  );

  // Listen for postMessage from the iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'markerPress' && onMarkerPress) {
          const loc = locations.find((l) => l.id === data.id);
          if (loc) onMarkerPress(loc);
        }
        if (data.type === 'mapPress' && onMapPress) {
          onMapPress({ latitude: data.lat, longitude: data.lng });
        }
      } catch (_) {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [locations, onMarkerPress, onMapPress]);

  return (
    <View style={[styles.mapWrapper, { height }]}>
      {/* @ts-ignore — iframe is valid on web */}
      <iframe
        ref={iframeRef}
        srcDoc={html}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: 0,
        }}
        title="Rural Connect Map"
        sandbox="allow-scripts allow-same-origin"
      />
    </View>
  );
};

// ─── Native fallback (coordinate display) ────────────────────────────────────
const LeafletMapNative: React.FC<LeafletMapProps> = ({
  locations = [],
  height = 340,
}) => (
  <View style={[styles.nativeFallback, { height }]}>
    <Text style={styles.nativeTitle}>🗺️ Map — India</Text>
    <Text style={styles.nativeSubtitle}>
      {locations.length} location{locations.length !== 1 ? 's' : ''} marked
    </Text>
    {locations.slice(0, 5).map((loc) => (
      <View key={loc.id} style={styles.nativeItem}>
        <View
          style={[
            styles.nativeDot,
            { backgroundColor: markerColor(loc.status) },
          ]}
        />
        <Text style={styles.nativeItemText}>
          {loc.title} ({loc.latitude.toFixed(3)}, {loc.longitude.toFixed(3)})
        </Text>
      </View>
    ))}
  </View>
);

// ─── Exported component ───────────────────────────────────────────────────────
const LeafletMap: React.FC<LeafletMapProps> = (props) =>
  Platform.OS === 'web' ? (
    <LeafletMapWeb {...props} />
  ) : (
    <LeafletMapNative {...props} />
  );

export default LeafletMap;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  mapWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  nativeFallback: {
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  nativeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },
  nativeSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  nativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  nativeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  nativeItemText: {
    fontSize: 12,
    color: '#444',
  },
});
