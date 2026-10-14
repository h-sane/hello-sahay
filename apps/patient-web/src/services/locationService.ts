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
    name: 'Chennai Suburban (Tambaram / Guindy)',
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
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        const addr = data.address;
        if (addr) {
          const locality =
            addr.city || addr.town || addr.village || addr.county || addr.state_district || addr.suburb;
          const state = addr.state;
          if (locality && state) {
            return `${locality}, ${state}`;
          } else if (locality) {
            return `${locality}, India`;
          }
        }
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

  // Complete robust location detection: Browser Geolocation (low-accuracy, fast) -> IP Geolocation -> Default Indian preset
  async detectUserLocation(): Promise<UserCoordinates> {
    return new Promise((resolve) => {
      let hasResolved = false;

      const finishWithCoordinates = (result: UserCoordinates) => {
        if (hasResolved) return;
        hasResolved = true;
        locationService.saveLocation(result);
        resolve(result);
      };

      // Race with 3.5s timeout: if browser GPS hangs, fallback to IP detection or closest preset immediately
      const timeoutId = setTimeout(async () => {
        if (!hasResolved) {
          const ipCoords = await locationService.detectLocationViaIp();
          if (ipCoords) {
            finishWithCoordinates(ipCoords);
          } else {
            const fallback: UserCoordinates = {
              latitude: 12.5113,
              longitude: 79.8837,
              districtDetected: 'Chengalpattu Rural, Tamil Nadu',
              isLocating: false,
            };
            finishWithCoordinates(fallback);
          }
        }
      }, 3500);

      // Check if browser geolocation exists
      if (typeof window === 'undefined' || !navigator.geolocation) {
        clearTimeout(timeoutId);
        locationService.detectLocationViaIp().then((ipCoords) => {
          if (ipCoords) {
            finishWithCoordinates(ipCoords);
          } else {
            finishWithCoordinates({
              latitude: 12.5113,
              longitude: 79.8837,
              districtDetected: 'Chengalpattu Rural, Tamil Nadu',
              isLocating: false,
            });
          }
        });
        return;
      }

      // Important: enableHighAccuracy must be FALSE so browser can return quick WiFi/cell network location without waiting for GPS hardware
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timeoutId);
          if (hasResolved) return;

          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // Quick reverse geocode
          const resolvedName = await locationService.reverseGeocode(lat, lon);

          finishWithCoordinates({
            latitude: lat,
            longitude: lon,
            accuracy: position.coords.accuracy,
            districtDetected: resolvedName,
            isLocating: false,
          });
        },
        async (err) => {
          console.warn('Browser GPS returned error, falling back to IP detection:', err.message);
          clearTimeout(timeoutId);
          if (hasResolved) return;

          const ipCoords = await locationService.detectLocationViaIp();
          if (ipCoords) {
            finishWithCoordinates(ipCoords);
          } else {
            finishWithCoordinates({
              latitude: 12.5113,
              longitude: 79.8837,
              districtDetected: 'Chengalpattu Rural, Tamil Nadu',
              error: err.message,
              isLocating: false,
            });
          }
        },
        {
          enableHighAccuracy: false, // Prevents hanging on non-GPS devices
          timeout: 3000,
          maximumAge: 60000,
        }
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

  // Match condition/symptom to appropriate hospital
  matchHospitalByCondition(
    condition: string,
    hospitals: Hospital[],
    coords: UserCoordinates
  ): { hospital: Hospital; department: string; matchReason: string } | null {
    const sorted = locationService.computeDistances(hospitals, coords);
    const cond = condition.toLowerCase();

    // 1. Cardiac Emergency (Chest pain, heart attack, shortness of breath)
    if (cond.includes('chest') || cond.includes('heart') || cond.includes('நெஞ்சு') || cond.includes('हार्ट') || cond.includes('सीना')) {
      const emergencyFacility =
        sorted.find((h) => h.emergency24x7 && (h.category === 'medical_college' || h.category === 'district_hospital')) ||
        sorted.find((h) => h.emergency24x7) ||
        sorted[0];

      return {
        hospital: emergencyFacility,
        department: 'Emergency Cardiac ICU & Resuscitation',
        matchReason: 'Equipped with 24x7 emergency resuscitation, ECG, defibrillators, and critical care physicians.',
      };
    }

    // 2. Bone, joint fracture, trauma
    if (cond.includes('bone') || cond.includes('fracture') || cond.includes('knee') || cond.includes('எலும்பு') || cond.includes('हड्डी') || cond.includes('घुटने')) {
      const orthoFacility =
        sorted.find((h) => h.departments.some((d) => d.toLowerCase().includes('ortho'))) ||
        sorted.find((h) => h.category === 'district_hospital' || h.category === 'medical_college') ||
        sorted[0];

      return {
        hospital: orthoFacility,
        department: 'Orthopedics & Digital X-Ray Wing',
        matchReason: 'Features specialist orthopedic surgeons, plaster room, digital radiography, and trauma stabilization.',
      };
    }

    // 3. Child health / Pediatric fever
    if (cond.includes('child') || cond.includes('baby') || cond.includes('குழந்தை') || cond.includes('बच्चा')) {
      const pediatricFacility =
        sorted.find((h) => h.departments.some((d) => d.toLowerCase().includes('pediatric'))) ||
        sorted[0];

      return {
        hospital: pediatricFacility,
        department: 'Pediatrics & Neonatal Care (Child OPD)',
        matchReason: 'Staffed by pediatric specialists, neonatal stabilization units, and child immunization services.',
      };
    }

    // 4. Eye redness, cataract, blurriness
    if (cond.includes('eye') || cond.includes('vision') || cond.includes('கண்') || cond.includes('आंख')) {
      const eyeFacility =
        sorted.find((h) => h.departments.some((d) => d.toLowerCase().includes('ophthal'))) ||
        sorted.find((h) => h.category === 'district_hospital' || h.category === 'medical_college') ||
        sorted[0];

      return {
        hospital: eyeFacility,
        department: 'Ophthalmology & Vision Care OPD',
        matchReason: 'Equipped with slit-lamp microscopy, refraction units, and cataract screening facilities.',
      };
    }

    // 5. Default Primary Care / General Medicine (PHC or Taluk)
    const phcOrTaluk =
      sorted.find((h) => h.category === 'phc' || h.category === 'taluk_hospital') || sorted[0];

    return {
      hospital: phcOrTaluk,
      department: 'General Outpatient & Triage OPD',
      matchReason: 'Closest verified government healthcare centre with free doctor consultation and essential medicines.',
    };
  },

  // Alias for backward and forward compatibility
  findRecommendedHospitalForSymptoms(
    hospitals: Hospital[],
    coords: UserCoordinates,
    symptoms: string
  ): { hospital: Hospital; department: string; matchReason: string } | null {
    return locationService.matchHospitalByCondition(symptoms, hospitals, coords);
  },
};
