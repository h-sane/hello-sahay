import { Hospital, UserCoordinates } from '../types';
import { api, ApiFacility } from './api';

// Facilities come from GET /facilities and are cached here so the views can keep
// reading them synchronously. App calls load() on start and when the location changes.
let hospitals: Hospital[] = [];
let lastError = '';

const CATEGORY: Record<ApiFacility['type'], Hospital['category']> = {
  PHC: 'phc',
  CHC: 'chc',
  GH: 'government',
  private: 'private',
};

function toHospital(f: ApiFacility): Hospital {
  const name = f.name;
  const address = f.address || '';
  const schemes: Hospital['schemesSupported'] = [];
  if (f.pmjay) schemes.push('PM-JAY');
  if (f.cmchis) schemes.push('CMCHIS');
  return {
    id: String(f.id),
    name,
    nativeNames: { en: name, hi: name, ta: name },
    category: CATEGORY[f.type] ?? 'private',
    district: 'Chengalpattu',
    state: 'Tamil Nadu',
    pinCode: address.match(/\b\d{6}\b/)?.[0] ?? '',
    address: { en: address, hi: address, ta: address },
    distanceKm: f.distance_km ?? 0,
    departments: f.departments,
    emergency24x7: /24/.test(f.hours || ''),
    schemesSupported: schemes,
    contactPhone: f.phone || '',
    openingHours: f.hours || '',
    diagnosticServices: [],
    accessibilityInfo: '',
    verifiedDate: '',
    isDemo: true,
    latitude: f.lat ?? 0,
    longitude: f.lng ?? 0,
    isPartner: f.is_partner,
  };
}

export const hospitalService = {
  async load(coords?: UserCoordinates): Promise<void> {
    try {
      hospitals = (await api.facilities(coords)).map(toHospital);
      lastError = '';
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Could not load hospitals.';
    }
  },

  getError(): string {
    return lastError;
  },

  getAll(): Hospital[] {
    return hospitals;
  },

  getById(id: string): Hospital | undefined {
    return hospitals.find((h) => h.id === id);
  },

  search(
    query: string,
    filters?: {
      category?: 'government' | 'phc' | 'private' | 'all';
      scheme?: 'PM-JAY' | 'CMCHIS' | 'all';
      emergencyOnly?: boolean;
    }
  ): Hospital[] {
    let result = [...hospitals];

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.address.en.toLowerCase().includes(q) ||
          h.pinCode.includes(q) ||
          h.departments.some((d) => d.toLowerCase().includes(q))
      );
    }

    if (filters) {
      if (filters.category && filters.category !== 'all') {
        if (filters.category === 'government') {
          result = result.filter((h) => h.category === 'government' || h.category === 'phc' || h.category === 'chc');
        } else {
          result = result.filter((h) => h.category === filters.category);
        }
      }
      if (filters.scheme && filters.scheme !== 'all') {
        result = result.filter((h) => h.schemesSupported.includes(filters.scheme as 'PM-JAY' | 'CMCHIS'));
      }
      if (filters.emergencyOnly) {
        result = result.filter((h) => h.emergency24x7);
      }
    }

    // Free government options first, then nearest.
    const isGov = (h: Hospital) => h.category !== 'private';
    return result.sort((a, b) => {
      if (isGov(a) !== isGov(b)) return isGov(a) ? -1 : 1;
      return a.distanceKm - b.distanceKm;
    });
  },
};
