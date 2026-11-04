import { Hospital, UserCoordinates } from '../types';

const SAVED_LOCATION_KEY = 'hello_sahay_user_saved_location';

export const locationService = {
  // Haversine formula to calculate distance in km between two coordinate points
  calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return Math.round(d * 10) / 10;
  },

  // Quick reverse geocode; when both services are down the place keeps a plain label, never a nearby list entry
  async reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`,
        {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'HelloSahayApp/1.0' },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        const addr = data.address;
        if (addr) {
          const sub = addr.suburb || addr.neighbourhood || addr.residential || addr.city_district || addr.subdistrict;
          const city = addr.city || addr.town || addr.village || addr.county;
          const state = addr.state || 'Tamil Nadu';
          if (sub && city && sub.toLowerCase() !== city.toLowerCase()) {
            return `${sub}, ${city}, ${state}`;
          }
          const locality = sub || city || addr.state_district || 'India';
          return `${locality}, ${state}`;
        }
      }
    } catch {
      // Try secondary reverse geocoder
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const resp = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (resp.ok) {
        const data = await resp.json();
        const locality = data.locality || data.city || data.principalSubdivision;
        const state = data.principalSubdivision || 'Tamil Nadu';
        if (locality) return `${locality}, ${state}`;
      }
    } catch {
      // both reverse geocoders are down
    }

    return 'Your current location';
  },

  // Get saved location from storage if user already set it
  getSavedLocation(): UserCoordinates | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(SAVED_LOCATION_KEY);
      if (stored) {
        return JSON.parse(stored) as UserCoordinates;
      }
    } catch (e) {
      console.warn('Error reading stored location:', e);
    }
    return null;
  },

  // Save location to storage
  saveLocation(coords: UserCoordinates) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(coords));
    } catch (e) {
      console.warn('Error saving location:', e);
    }
  },

  // The phone's own GPS, then its network position. Never an IP guess or a default district: a wrong place
  // sends the patient to hospitals far from where they are, so a failure is reported and the user picks an area.
  async detectUserLocation(): Promise<UserCoordinates> {
    const fix = (options: PositionOptions) =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) return reject(new Error('no geolocation'));
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    let position: GeolocationPosition;
    try {
      position = await fix({ enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 });
    } catch {
      position = await fix({ enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 });
    }
    const { latitude, longitude, accuracy } = position.coords;
    const result: UserCoordinates = {
      latitude, longitude, accuracy,
      districtDetected: await locationService.reverseGeocode(latitude, longitude),
      isLocating: false,
    };
    locationService.saveLocation(result);
    return result;
  },

  // A place the patient chose from the live place search
  setManualLocation(place: { name: string; detail?: string; lat: number; lng: number }): UserCoordinates {
    const coords: UserCoordinates = {
      latitude: place.lat,
      longitude: place.lng,
      districtDetected: place.detail ? `${place.name}, ${place.detail}` : place.name,
      isLocating: false,
      manual: true,
    };
    locationService.saveLocation(coords);
    return coords;
  },

  // Compute distances for a list of hospitals from user coordinates
  computeDistances(hospitals: Hospital[], coords: UserCoordinates): Hospital[] {
    return hospitals
      .map((hosp) => {
        const dist = locationService.calculateDistanceKm(
          coords.latitude,
          coords.longitude,
          hosp.latitude,
          hosp.longitude
        );
        return {
          ...hosp,
          distanceKm: dist,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  },

  // Find single nearest hospital
  getNearestHospital(hospitals: Hospital[], coords: UserCoordinates): Hospital | null {
    if (!hospitals.length) return null;
    const sorted = locationService.computeDistances(hospitals, coords);
    return sorted[0];
  },
};
