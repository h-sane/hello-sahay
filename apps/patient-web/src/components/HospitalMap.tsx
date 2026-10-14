import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hospital, UserCoordinates } from '../types';

interface HospitalMapProps {
  hospitals: Hospital[];
  user?: UserCoordinates;
  selectedId: string | null;
  onSelect: (hospital: Hospital) => void;
}

const pinIcon = (government: boolean, selected: boolean) =>
  L.divIcon({
    className: 'hs-pin-wrap',
    html: `<span class="hs-pin ${government ? 'hs-pin-gov' : 'hs-pin-pvt'} ${selected ? 'hs-pin-on' : ''}"></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

const youIcon = L.divIcon({ className: 'hs-pin-wrap', html: '<span class="hs-you"></span>', iconSize: [20, 20], iconAnchor: [10, 10] });

// Real street map (OpenStreetMap tiles) with a pin per hospital and a dot for the patient.
export const HospitalMap: React.FC<HospitalMapProps> = ({ hospitals, user, selectedId, onSelect }) => {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const fittedFor = useRef('');

  useEffect(() => {
    const m = L.map(box.current as HTMLDivElement, { zoomControl: true }).setView([13.0, 80.2], 11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    const settle = setTimeout(() => m.invalidateSize(), 50);
    return () => {
      clearTimeout(settle);
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    const group = layer.current;
    if (!m || !group) return;
    group.clearLayers();
    const points: L.LatLngTuple[] = [];
    hospitals.forEach((h) => {
      if (!h.latitude && !h.longitude) return;
      const point: L.LatLngTuple = [h.latitude, h.longitude];
      points.push(point);
      L.marker(point, {
        icon: pinIcon(h.category !== 'private', h.id === selectedId),
        title: h.name,
        zIndexOffset: h.id === selectedId ? 1000 : 0,
      })
        .on('click', () => onSelect(h))
        .addTo(group);
    });
    if (user && (user.latitude || user.longitude)) {
      const here: L.LatLngTuple = [user.latitude, user.longitude];
      points.push(here);
      L.marker(here, { icon: youIcon, title: 'You', interactive: false, zIndexOffset: 500 }).addTo(group);
    }
    const key = hospitals.map((h) => h.id).join('|');
    if (points.length && fittedFor.current !== key) {
      m.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15 });
      fittedFor.current = key;
    }
  }, [hospitals, selectedId, user?.latitude, user?.longitude, onSelect]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={box} className="w-full h-[52vh] min-h-[320px] rounded-2xl overflow-hidden border border-slate-200 z-0" />;
};
