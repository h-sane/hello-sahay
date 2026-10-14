import { Hospital, UserCoordinates } from '../types';

export interface LocationPreset {
  id: string;
  name: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  isRuralHub?: boolean;
}

export const INDIAN_LOCATION_PRESETS: LocationPreset[] = [
  // 1. Tamil Nadu
  {
    id: 'loc-tn-maduravoyal',
    name: 'Maduravoyal (West Chennai)',
    district: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 13.0673,
    longitude: 80.1607,
    isRuralHub: false,
  },
  {
    id: 'loc-tn-udumalaipettai',
    name: 'Udumalaippettai (Tiruppur)',
    district: 'Tiruppur',
    state: 'Tamil Nadu',
    latitude: 10.5847,
    longitude: 77.2479,
    isRuralHub: true,
  },
  {
    id: 'loc-tn-chennai-central',
    name: 'Chennai Central (Kilpauk / Egmore)',
    district: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 13.0784,
    longitude: 80.2437,
    isRuralHub: false,
  },
  {
    id: 'loc-tn-chengalpattu',
    name: 'Chengalpattu Rural (Maduranthakam)',
    district: 'Chengalpattu',
    state: 'Tamil Nadu',
    latitude: 12.5113,
    longitude: 79.8837,
    isRuralHub: true,
  },
  {
    id: 'loc-tn-kanchipuram',
    name: 'Kanchipuram (Walajabad Belt)',
    district: 'Kanchipuram',
    state: 'Tamil Nadu',
    latitude: 12.8342,
    longitude: 79.7036,
    isRuralHub: true,
  },
  {
    id: 'loc-tn-chennai',
    name: 'Chennai South (Tambaram / Guindy)',
    district: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 12.9249,
    longitude: 80.1165,
    isRuralHub: false,
  },
  {
    id: 'loc-tn-madurai',
    name: 'Madurai Rural (Usilampatti Belt)',
    district: 'Madurai',
    state: 'Tamil Nadu',
    latitude: 9.9252,
    longitude: 78.1198,
    isRuralHub: true,
  },
  {
    id: 'loc-tn-salem',
    name: 'Salem (Attur / Omalur)',
    district: 'Salem',
    state: 'Tamil Nadu',
    latitude: 11.6643,
    longitude: 78.146,
    isRuralHub: true,
  },
  {
    id: 'loc-tn-coimbatore',
    name: 'Coimbatore (Pollachi Rural)',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    latitude: 10.6609,
    longitude: 77.0048,
    isRuralHub: true,
  },
  {
    id: 'loc-tn-trichy',
    name: 'Tiruchirappalli (Manapparai Hub)',
    district: 'Tiruchirappalli',
    state: 'Tamil Nadu',
    latitude: 10.7905,
    longitude: 78.7047,
    isRuralHub: true,
  },
  {
    id: 'loc-tn-tirunelveli',
    name: 'Tirunelveli (Ambasamudram Rural)',
    district: 'Tirunelveli',
    state: 'Tamil Nadu',
    latitude: 8.7139,
    longitude: 77.7567,
    isRuralHub: true,
  },

  // 2. Uttar Pradesh & North India
  {
    id: 'loc-up-gorakhpur',
    name: 'Gorakhpur (Chauri Chaura Rural)',
    district: 'Gorakhpur',
    state: 'Uttar Pradesh',
    latitude: 26.7606,
    longitude: 83.3732,
    isRuralHub: true,
  },
  {
    id: 'loc-up-varanasi',
    name: 'Varanasi (Pindra Rural Hub)',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    latitude: 25.3176,
    longitude: 82.9739,
    isRuralHub: true,
  },
  {
    id: 'loc-up-lucknow',
    name: 'Lucknow (Mohanlalganj Tehsil)',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    latitude: 26.8467,
    longitude: 80.9462,
    isRuralHub: true,
  },
  {
    id: 'loc-up-kanpur',
    name: 'Kanpur Dehat (Akbarpur Rural)',
    district: 'Kanpur',
    state: 'Uttar Pradesh',
    latitude: 26.4499,
    longitude: 80.3319,
    isRuralHub: true,
  },
  {
    id: 'loc-up-prayagraj',
    name: 'Prayagraj (Phulpur Rural)',
    district: 'Prayagraj',
    state: 'Uttar Pradesh',
    latitude: 25.4358,
    longitude: 81.8463,
    isRuralHub: true,
  },

  // 3. Maharashtra
  {
    id: 'loc-mh-pune',
    name: 'Pune Rural (Shirur / Baramati)',
    district: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
    isRuralHub: true,
  },
  {
    id: 'loc-mh-nashik',
    name: 'Nashik (Dindori Tribal Belt)',
    district: 'Nashik',
    state: 'Maharashtra',
    latitude: 19.9975,
    longitude: 73.7898,
    isRuralHub: true,
  },
  {
    id: 'loc-mh-mumbai',
    name: 'Mumbai Suburban (Thane / Palghar Rural)',
    district: 'Thane',
    state: 'Maharashtra',
    latitude: 19.2183,
    longitude: 72.9781,
    isRuralHub: false,
  },
  {
    id: 'loc-mh-nagpur',
    name: 'Nagpur Rural (Katol / Saoner)',
    district: 'Nagpur',
    state: 'Maharashtra',
    latitude: 21.1458,
    longitude: 79.0882,
    isRuralHub: true,
  },
  {
    id: 'loc-mh-aurangabad',
    name: 'Chhatrapati Sambhajinagar (Paithan Rural)',
    district: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    latitude: 19.8762,
    longitude: 75.3433,
    isRuralHub: true,
  },

  // 4. Karnataka
  {
    id: 'loc-ka-bengaluru',
    name: 'Bengaluru Rural (Doddaballapura)',
    district: 'Bengaluru Rural',
    state: 'Karnataka',
    latitude: 13.2934,
    longitude: 77.5336,
    isRuralHub: true,
  },
  {
    id: 'loc-ka-mysuru',
    name: 'Mysuru (Nanjangud Rural)',
    district: 'Mysuru',
    state: 'Karnataka',
    latitude: 12.2958,
    longitude: 76.6394,
    isRuralHub: true,
  },
  {
    id: 'loc-ka-belagavi',
    name: 'Belagavi (Chikkodi Rural)',
    district: 'Belagavi',
    state: 'Karnataka',
    latitude: 15.8497,
    longitude: 74.4977,
    isRuralHub: true,
  },
  {
    id: 'loc-ka-hubballi',
    name: 'Dharwad / Hubballi Rural',
    district: 'Dharwad',
    state: 'Karnataka',
    latitude: 15.3647,
    longitude: 75.124,
    isRuralHub: true,
  },

  // 5. Telangana & Andhra Pradesh
  {
    id: 'loc-tg-hyderabad',
    name: 'Hyderabad Outskirts (Ranga Reddy)',
    district: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.385,
    longitude: 78.4867,
    isRuralHub: false,
  },
  {
    id: 'loc-tg-warangal',
    name: 'Warangal Rural (Parkal)',
    district: 'Warangal',
    state: 'Telangana',
    latitude: 17.9689,
    longitude: 79.5941,
    isRuralHub: true,
  },
  {
    id: 'loc-ap-guntur',
    name: 'Guntur Rural (Tenali Belt)',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    latitude: 16.3067,
    longitude: 80.4365,
    isRuralHub: true,
  },
  {
    id: 'loc-ap-visakhapatnam',
    name: 'Visakhapatnam (Anakapalle Rural)',
    district: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    latitude: 17.6868,
    longitude: 83.2185,
    isRuralHub: true,
  },
  {
    id: 'loc-ap-vijayawada',
    name: 'Krishna / Vijayawada Rural (Nuzvid)',
    district: 'Krishna',
    state: 'Andhra Pradesh',
    latitude: 16.5062,
    longitude: 80.648,
    isRuralHub: true,
  },

  // 6. West Bengal & Bihar
  {
    id: 'loc-wb-kolkata',
    name: 'North 24 Parganas (Barasat Rural)',
    district: 'North 24 Parganas',
    state: 'West Bengal',
    latitude: 22.7214,
    longitude: 88.482,
    isRuralHub: true,
  },
  {
    id: 'loc-wb-howrah',
    name: 'Howrah / Uluberia Rural',
    district: 'Howrah',
    state: 'West Bengal',
    latitude: 22.5958,
    longitude: 88.2636,
    isRuralHub: true,
  },
  {
    id: 'loc-br-patna',
    name: 'Patna Rural (Danapur Belt)',
    district: 'Patna',
    state: 'Bihar',
    latitude: 25.5941,
    longitude: 85.1376,
    isRuralHub: true,
  },
  {
    id: 'loc-br-muzaffarpur',
    name: 'Muzaffarpur Rural (Kanti)',
    district: 'Muzaffarpur',
    state: 'Bihar',
    latitude: 26.1209,
    longitude: 85.3647,
    isRuralHub: true,
  },
  {
    id: 'loc-br-gaya',
    name: 'Gaya (Bodh Gaya Rural)',
    district: 'Gaya',
    state: 'Bihar',
    latitude: 24.7914,
    longitude: 85.0002,
    isRuralHub: true,
  },

  // 7. Gujarat
  {
    id: 'loc-gj-ahmedabad',
    name: 'Ahmedabad Rural (Sanand Industrial Belt)',
    district: 'Ahmedabad',
    state: 'Gujarat',
    latitude: 23.0225,
    longitude: 72.5714,
    isRuralHub: true,
  },
  {
    id: 'loc-gj-surat',
    name: 'Surat Rural (Bardoli)',
    district: 'Surat',
    state: 'Gujarat',
    latitude: 21.1702,
    longitude: 72.8311,
    isRuralHub: true,
  },
  {
    id: 'loc-gj-rajkot',
    name: 'Rajkot Rural (Gondal)',
    district: 'Rajkot',
    state: 'Gujarat',
    latitude: 22.3039,
    longitude: 70.8022,
    isRuralHub: true,
  },

  // 8. Kerala
  {
    id: 'loc-kl-trivandrum',
    name: 'Thiruvananthapuram (Nedumangad Rural)',
    district: 'Thiruvananthapuram',
    state: 'Kerala',
    latitude: 8.5241,
    longitude: 76.9366,
    isRuralHub: true,
  },
  {
    id: 'loc-kl-ernakulam',
    name: 'Ernakulam / Kochi (Aluva Rural)',
    district: 'Ernakulam',
    state: 'Kerala',
    latitude: 9.9816,
    longitude: 76.2999,
    isRuralHub: true,
  },

  // 9. Delhi NCR, Rajasthan, Madhya Pradesh
  {
    id: 'loc-dl-delhi',
    name: 'Delhi NCR (Central / Rural Belt)',
    district: 'Delhi',
    state: 'Delhi NCR',
    latitude: 28.6139,
    longitude: 77.209,
    isRuralHub: false,
  },
  {
    id: 'loc-rj-jaipur',
    name: 'Jaipur Rural (Chomu Belt)',
    district: 'Jaipur',
    state: 'Rajasthan',
    latitude: 26.9124,
    longitude: 75.7873,
    isRuralHub: true,
  },
  {
    id: 'loc-mp-bhopal',
    name: 'Bhopal Rural (Berasia)',
    district: 'Bhopal',
    state: 'Madhya Pradesh',
    latitude: 23.2599,
    longitude: 77.4126,
    isRuralHub: true,
  },
  {
    id: 'loc-mp-indore',
    name: 'Indore Rural (Mhow Belt)',
    district: 'Indore',
    state: 'Madhya Pradesh',
    latitude: 22.7196,
    longitude: 75.8577,
    isRuralHub: true,
  },
];

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

  // Find the closest known Indian preset to given coordinates
  findClosestPreset(lat: number, lon: number): LocationPreset {
    let closest = INDIAN_LOCATION_PRESETS[0];
    let minDistance = Infinity;

    for (const preset of INDIAN_LOCATION_PRESETS) {
      const dist = locationService.calculateDistanceKm(lat, lon, preset.latitude, preset.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        closest = preset;
      }
    }

    return closest;
  },

  // Quick reverse geocode with fallback to Indian preset
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
      // Fallback to closest preset calculation
    }

    const closest = locationService.findClosestPreset(lat, lon);
    return `${closest.name}, ${closest.state}`;
  },

  // Fetch location via network IP from multiple endpoints with rapid fallback
  async detectLocationViaIp(): Promise<UserCoordinates | null> {
    // Attempt 1: ipapi.co
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2200);

      const resp = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          const locality = data.city || data.region || 'India';
          const state = data.region || 'India';
          const name = `${locality}, ${state}`;
          const result: UserCoordinates = {
            latitude: data.latitude,
            longitude: data.longitude,
            districtDetected: name,
            isLocating: false,
          };
          locationService.saveLocation(result);
          return result;
        }
      }
    } catch {
      // Try next service
    }

    // Attempt 2: bigdatacloud client
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2200);

      const resp = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          const locality = data.city || data.locality || data.principalSubdivision;
          const state = data.principalSubdivision || 'India';
          const name = locality ? `${locality}, ${state}` : `${state}, India`;

          const result: UserCoordinates = {
            latitude: data.latitude,
            longitude: data.longitude,
            districtDetected: name,
            isLocating: false,
          };
          locationService.saveLocation(result);
          return result;
        }
      }
    } catch {
      // Ignore network errors
    }

    // Attempt 3: freeipapi.com
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const resp = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          const name = `${data.cityName || data.regionName || 'India'}, ${data.regionName || 'India'}`;
          const result: UserCoordinates = {
            latitude: data.latitude,
            longitude: data.longitude,
            districtDetected: name,
            isLocating: false,
          };
          locationService.saveLocation(result);
          return result;
        }
      }
    } catch {
      // Ignore
    }

    return null;
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

  // Complete robust location detection: Phone High-Accuracy GPS -> Low-Accuracy Network -> IP Geolocation -> Default Indian preset
  async detectUserLocation(): Promise<UserCoordinates> {
    return new Promise((resolve) => {
      let hasResolved = false;

      const finishWithCoordinates = (result: UserCoordinates) => {
        if (hasResolved) return;
        hasResolved = true;
        locationService.saveLocation(result);
        resolve(result);
      };

      // Global safety timeout
      const timeoutId = setTimeout(async () => {
        if (!hasResolved) {
          const ipCoords = await locationService.detectLocationViaIp();
          if (ipCoords) {
            finishWithCoordinates(ipCoords);
          } else {
            const fallback: UserCoordinates = {
              latitude: 13.0673,
              longitude: 80.1607,
              districtDetected: 'Maduravoyal, Chennai',
              isLocating: false,
            };
            finishWithCoordinates(fallback);
          }
        }
      }, 7000);

      // Check if browser geolocation exists
      if (typeof window === 'undefined' || !navigator.geolocation) {
        clearTimeout(timeoutId);
        locationService.detectLocationViaIp().then((ipCoords) => {
          if (ipCoords) {
            finishWithCoordinates(ipCoords);
          } else {
            finishWithCoordinates({
              latitude: 13.0673,
              longitude: 80.1607,
              districtDetected: 'Maduravoyal, Chennai',
              isLocating: false,
            });
          }
        });
        return;
      }

      // First try real hardware GPS (high accuracy) on phone
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timeoutId);
          if (hasResolved) return;

          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const resolvedName = await locationService.reverseGeocode(lat, lon);

          finishWithCoordinates({
            latitude: lat,
            longitude: lon,
            accuracy: position.coords.accuracy,
            districtDetected: resolvedName,
            isLocating: false,
          });
        },
        async () => {
          // If high accuracy GPS times out/errors, fallback to network location
          navigator.geolocation.getCurrentPosition(
            async (pos2) => {
              clearTimeout(timeoutId);
              if (hasResolved) return;
              const lat = pos2.coords.latitude;
              const lon = pos2.coords.longitude;
              const resolvedName = await locationService.reverseGeocode(lat, lon);
              finishWithCoordinates({
                latitude: lat,
                longitude: lon,
                accuracy: pos2.coords.accuracy,
                districtDetected: resolvedName,
                isLocating: false,
              });
            },
            async () => {
              clearTimeout(timeoutId);
              if (hasResolved) return;
              const ipCoords = await locationService.detectLocationViaIp();
              if (ipCoords) {
                finishWithCoordinates(ipCoords);
              } else {
                finishWithCoordinates({
                  latitude: 13.0673,
                  longitude: 80.1607,
                  districtDetected: 'Maduravoyal, Chennai',
                  isLocating: false,
                });
              }
            },
            { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
          );
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
      );
    });
  },

  // Set location manually from a preset or search result
  setManualLocation(preset: LocationPreset): UserCoordinates {
    const coords: UserCoordinates = {
      latitude: preset.latitude,
      longitude: preset.longitude,
      districtDetected: `${preset.name}, ${preset.state}`,
      isLocating: false,
    };
    locationService.saveLocation(coords);
    return coords;
  },

  // Return location presets
  getPresets(): LocationPreset[] {
    return INDIAN_LOCATION_PRESETS;
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
