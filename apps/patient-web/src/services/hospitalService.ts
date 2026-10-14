import { Hospital, UserCoordinates } from '../types';
import { api, ApiFacility, ApiNearbyHospital } from './api';

// Hospitals come from the nearby lookup (real, OpenStreetMap) with GET /facilities as the fallback, cached here so the views can keep
// reading them synchronously. App calls load() on start and when the location changes.
let hospitals: Hospital[] = [];
let demoDepartments: string[] = ['General Medicine'];
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

const KIND_LABEL: Record<ApiNearbyHospital['kind'], string> = {
  government: 'Government hospital',
  phc: 'Primary health centre',
  private: 'Private hospital',
  hospital: 'Hospital',
};

// A real hospital from OpenStreetMap, with scheme cover checked by the API against Tamil Nadu's CMCHIS list.
// Booking and calls are the demo wiring: every one books into the same partner facility (so each shows up on its
// Sahay Desk) and calls go to the demo number.
function fromNearby(n: ApiNearbyHospital): Hospital {
  const address = n.address || '';
  return {
    id: `osm:${n.lat.toFixed(4)},${n.lng.toFixed(4)}`,
    bookFacilityId: n.book_facility_id ?? undefined,
    name: n.name,
    nativeNames: { en: n.name, hi: n.name, ta: n.name },
    category: n.kind === 'hospital' ? 'private' : n.kind,
    district: '',
    state: 'Tamil Nadu',
    pinCode: address.match(/\d{6}/)?.[0] ?? '',
    address: { en: address, hi: address, ta: address },
    distanceKm: n.distance_km,
    departments: [], // OpenStreetMap does not list them; booking uses the demo hospital's (bookingDepartments)
    emergency24x7: n.emergency,
    schemesSupported: [...(n.pmjay ? (['PM-JAY'] as const) : []), ...(n.cmchis ? (['CMCHIS'] as const) : [])],
    contactPhone: n.phone || '',
    openingHours: '',
    diagnosticServices: [],
    accessibilityInfo: '',
    verifiedDate: '',
    isDemo: false,
    latitude: n.lat,
    longitude: n.lng,
    isPartner: n.book_facility_id != null,
    speciality: n.speciality ?? undefined,
    kindLabel: KIND_LABEL[n.kind],
    schemeChecked: n.scheme_checked ?? false,
  };
}

// One lookup per ~100 m cell is shared by load() and nearestReal(); the server also caches for an hour.
let nearbyKey = '';
let nearbyLookup: Promise<ApiNearbyHospital[]> | null = null;
function lookupNearby(coords: UserCoordinates): Promise<ApiNearbyHospital[]> {
  const key = `${coords.latitude.toFixed(3)},${coords.longitude.toFixed(3)}`;
  if (key !== nearbyKey || !nearbyLookup) {
    nearbyKey = key;
    nearbyLookup = api.nearbyHospitals(coords).catch(() => {
      nearbyKey = ''; // a failed lookup is retried next time
      return [] as ApiNearbyHospital[];
    });
  }
  return nearbyLookup;
}

export const hospitalService = {
  // Nearest real hospital to the user, or null when the lookup fails.
  async nearestReal(coords: UserCoordinates): Promise<Hospital | null> {
    const [first] = await lookupNearby(coords);
    return first ? fromNearby(first) : null;
  },

  // The list every screen reads: real hospitals near the user (OpenStreetMap), nearest first. When that lookup
  // finds nothing, the seeded demo facilities stand in so the screens are never empty.
  async load(coords?: UserCoordinates): Promise<void> {
    const [facilities, nearby] = await Promise.allSettled([
      api.facilities(coords),
      coords ? lookupNearby(coords) : Promise.resolve([] as ApiNearbyHospital[]),
    ]);
    const seeded = facilities.status === 'fulfilled' ? facilities.value : [];
    demoDepartments = seeded.find((f) => f.is_partner)?.departments ?? demoDepartments;
    const real = nearby.status === 'fulfilled' ? nearby.value : [];
    if (real.length) {
      hospitals = real.map(fromNearby);
      lastError = '';
    } else if (facilities.status === 'fulfilled') {
      hospitals = seeded.map(toHospital);
      lastError = '';
    } else {
      lastError = facilities.reason instanceof Error ? facilities.reason.message : 'Could not load hospitals.';
    }
  },

  // Departments a booking can choose from: the demo hospital's, because its doctors take every booking.
  bookingDepartments(): string[] {
    return demoDepartments;
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
      scheme?: 'PM-JAY' | 'CMCHIS' | 'any' | 'all';
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
        const wanted = filters.scheme;
        result = result.filter((h) =>
          wanted === 'any' ? h.schemesSupported.length > 0 : h.schemesSupported.includes(wanted)
        );
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
