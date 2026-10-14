import { Hospital, UserCoordinates } from '../types';
import { api, ApiFacility } from './api';
import { locationService } from './locationService';

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

function extractDistrict(address: string): string {
  if (/chennai/i.test(address) || /maduravoyal/i.test(address) || /koyambedu/i.test(address) || /poonamallee/i.test(address)) {
    return 'Chennai';
  }
  if (/udumalaip/i.test(address) || /tiruppur/i.test(address)) {
    return 'Tiruppur';
  }
  if (/coimbatore/i.test(address)) {
    return 'Coimbatore';
  }
  if (/kanchipuram/i.test(address)) {
    return 'Kanchipuram';
  }
  return 'Chengalpattu';
}

const DEFAULT_FACILITIES: Hospital[] = [
  // Maduravoyal / West Chennai Hub
  {
    id: 'fac-chn-maduravoyal',
    name: 'Primary Health Centre Maduravoyal',
    nativeNames: {
      en: 'Primary Health Centre Maduravoyal',
      ta: 'ஆரம்ப சுகாதார நிலையம் மதுரவாயல்',
      hi: 'प्राथमिक स्वास्थ्य केंद्र मदुरवायल',
    },
    category: 'phc',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pinCode: '600095',
    address: {
      en: 'Alapakkam Main Road, Maduravoyal, Chennai 600095',
      ta: 'ஆலப்பாக்கம் பிரதான சாலை, மதுரவாயல், சென்னை 600095',
      hi: 'अलपक्कम मेन रोड, मदुरवायल, चेन्नई 600095',
    },
    distanceKm: 0.4,
    departments: ['General Medicine', 'Obstetrics', 'Paediatrics'],
    emergency24x7: false,
    schemesSupported: ['PM-JAY', 'CMCHIS'],
    contactPhone: '044-2476-0101',
    openingHours: 'Mon-Sat 08:00-16:00',
    diagnosticServices: ['Blood Sugar', 'BP Check', 'Maternal Care'],
    accessibilityInfo: 'Ground floor wheelchair accessible',
    verifiedDate: '2026-10-14',
    isDemo: false,
    latitude: 13.0658,
    longitude: 80.1632,
    isPartner: false,
  },
  {
    id: 'fac-chn-koyambedu',
    name: 'Urban Community Health Centre Koyambedu',
    nativeNames: {
      en: 'Urban Community Health Centre Koyambedu',
      ta: 'நகர்ப்புற சமூக நல மையம் கோயம்பேடு',
      hi: 'शहरी सामुदायिक स्वास्थ्य केंद्र कोयंबेडु',
    },
    category: 'chc',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pinCode: '600107',
    address: {
      en: 'Chinna Nolambur Road, Koyambedu, Chennai 600107',
      ta: 'சின்ன நொளம்பூர் சாலை, கோயம்பேடு, சென்னை 600107',
      hi: 'चिन्ना नोलम्बुर रोड, कोयंबेडु, चेन्नई 600107',
    },
    distanceKm: 2.8,
    departments: ['General Medicine', 'Obstetrics', 'Paediatrics', 'Dental'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY', 'CMCHIS'],
    contactPhone: '044-2479-0102',
    openingHours: 'Daily 08:00-20:00',
    diagnosticServices: ['X-Ray', 'Ultrasound', 'ECG', 'Lab'],
    accessibilityInfo: 'Ramp and wheelchair access',
    verifiedDate: '2026-10-14',
    isDemo: false,
    latitude: 13.0712,
    longitude: 80.185,
    isPartner: false,
  },
  {
    id: 'fac-chn-vanagaram',
    name: 'Apollo Speciality Hospital Vanagaram',
    nativeNames: {
      en: 'Apollo Speciality Hospital Vanagaram',
      ta: 'அப்பல்லோ ஸ்பெஷாலிட்டி மருத்துவமனை வானகரம்',
      hi: 'अपोलो स्पेशलिटी हॉस्पिटल वानगरम',
    },
    category: 'private',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pinCode: '600095',
    address: {
      en: 'Vanagaram-Ambattur Main Road, Vanagaram, Chennai 600095',
      ta: 'வானகரம்-அம்பத்தூர் மெயின் ரோடு, வானகரம், சென்னை 600095',
      hi: 'वानगरम-अंबत्तूर मेन रोड, वानगरम, चेन्नई 600095',
    },
    distanceKm: 1.6,
    departments: ['General Medicine', 'Obstetrics', 'Paediatrics', 'Orthopaedics', 'Cardiology'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY', 'CMCHIS'],
    contactPhone: '044-2653-0201',
    openingHours: 'Open 24 hours',
    diagnosticServices: ['24x7 Trauma', 'CT Scan', 'MRI', 'Cath Lab'],
    accessibilityInfo: 'Full hospital accessibility with stretcher lifts',
    verifiedDate: '2026-10-14',
    isDemo: true,
    latitude: 13.0642,
    longitude: 80.1472,
    isPartner: true,
  },
  {
    id: 'fac-chn-kilpauk',
    name: 'Government Kilpauk Medical College Hospital',
    nativeNames: {
      en: 'Government Kilpauk Medical College Hospital',
      ta: 'அரசு கீழ்ப்பாக்கம் மருத்துவக் கல்லூரி மருத்துவமனை',
      hi: 'राजकीय किलपॉक मेडिकल कॉलेज अस्पताल',
    },
    category: 'government',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pinCode: '600010',
    address: {
      en: 'Poonamallee High Road, Kilpauk, Chennai 600010',
      ta: 'பூந்தமல்லி நெடுஞ்சாலை, கீழ்ப்பாக்கம், சென்னை 600010',
      hi: 'पूनमल्ली हाई रोड, किलपॉक, चेन्नई 600010',
    },
    distanceKm: 8.9,
    departments: ['General Medicine', 'Obstetrics', 'Paediatrics', 'Ophthalmology', 'Dental', 'Orthopaedics'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY', 'CMCHIS'],
    contactPhone: '044-2836-0103',
    openingHours: 'Open 24 hours',
    diagnosticServices: ['Burns Unit', 'CT/MRI', 'Blood Bank', 'Emergency ICU'],
    accessibilityInfo: 'State referral teaching hospital',
    verifiedDate: '2026-10-14',
    isDemo: false,
    latitude: 13.0784,
    longitude: 80.2437,
    isPartner: false,
  },
  {
    id: 'fac-chn-poonamallee',
    name: 'Government Taluk Hospital Poonamallee',
    nativeNames: {
      en: 'Government Taluk Hospital Poonamallee',
      ta: 'அரசு வட்டார மருத்துவமனை பூந்தமல்லி',
      hi: 'सरकारी तालुक अस्पताल पूनमल्ली',
    },
    category: 'government',
    district: 'Chennai',
    state: 'Tamil Nadu',
    pinCode: '600056',
    address: {
      en: 'Trunk Road, Poonamallee, Chennai 600056',
      ta: 'ட்ரங்க் ரோடு, பூந்தமல்லி, சென்னை 600056',
      hi: 'ट्रंक रोड, पूनमल्ली, चेन्नई 600056',
    },
    distanceKm: 6.8,
    departments: ['General Medicine', 'Obstetrics', 'Paediatrics', 'Orthopaedics'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY', 'CMCHIS'],
    contactPhone: '044-2627-0104',
    openingHours: 'Open 24 hours',
    diagnosticServices: ['General Surgery', 'Labour Room', 'Pharmacy'],
    accessibilityInfo: 'Wheelchair access available',
    verifiedDate: '2026-10-14',
    isDemo: false,
    latitude: 13.0489,
    longitude: 80.0984,
    isPartner: false,
  },

  // Udumalaippettai / Tiruppur Hub
  {
    id: 'fac-tpr-udumalpet',
    name: 'Government Headquarters Hospital Udumalpet',
    nativeNames: {
      en: 'Government Headquarters Hospital Udumalpet',
      ta: 'அரசு தலைமை மருத்துவமனை உடுமலைப்பேட்டை',
      hi: 'सरकारी मुख्यालय अस्पताल उदुमलाईपेट',
    },
    category: 'government',
    district: 'Tiruppur',
    state: 'Tamil Nadu',
    pinCode: '642126',
    address: {
      en: 'Dhali Road, Udumalaipettai, Tiruppur 642126',
      ta: 'தளி ரோடு, உடுமலைப்பேட்டை, திருப்பூர் 642126',
      hi: 'ढाली रोड, उदुमलाईपेट्टई, तिरुप्पुर 642126',
    },
    distanceKm: 0.5,
    departments: ['General Medicine', 'Obstetrics', 'Paediatrics', 'Ophthalmology', 'Orthopaedics'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY', 'CMCHIS'],
    contactPhone: '04252-220101',
    openingHours: 'Open 24 hours',
    diagnosticServices: ['Maternity Ward', 'Emergency Casualty', 'X-Ray', 'Blood Bank'],
    accessibilityInfo: 'Ramp and wheelchair access',
    verifiedDate: '2026-10-14',
    isDemo: false,
    latitude: 10.5872,
    longitude: 77.2494,
    isPartner: false,
  },
  {
    id: 'fac-tpr-kaniyur',
    name: 'Primary Health Centre Kaniyur',
    nativeNames: {
      en: 'Primary Health Centre Kaniyur',
      ta: 'ஆரம்ப சுகாதார நிலையம் கணியூர்',
      hi: 'प्राथमिक स्वास्थ्य केंद्र कणियूर',
    },
    category: 'phc',
    district: 'Tiruppur',
    state: 'Tamil Nadu',
    pinCode: '642203',
    address: {
      en: 'Dharapuram Main Road, Kaniyur, Udumalpet Taluk 642203',
      ta: 'தாராபுரம் மெயின் ரோடு, கணியூர், உடுமலைப்பேட்டை வட்டம் 642203',
      hi: 'धारापुरम मेन रोड, कणियूर, उदुमलाईपेट तालुक 642203',
    },
    distanceKm: 14.2,
    departments: ['General Medicine', 'Obstetrics', 'Paediatrics'],
    emergency24x7: false,
    schemesSupported: ['PM-JAY', 'CMCHIS'],
    contactPhone: '04252-240102',
    openingHours: 'Mon-Sat 08:00-16:00',
    diagnosticServices: ['Immunization', 'Routine Lab'],
    accessibilityInfo: 'Ground level facility',
    verifiedDate: '2026-10-14',
    isDemo: false,
    latitude: 10.685,
    longitude: 77.362,
    isPartner: false,
  },

  // Chengalpattu / Rural Hub
  {
    id: 'fac-cgp-chc',
    name: 'Demo CHC Madurantakam',
    nativeNames: {
      en: 'Demo CHC Madurantakam',
      ta: 'மாதிரி சமூக நல மையம் மதுராந்தகம்',
      hi: 'डेमो सामुदायिक स्वास्थ्य केंद्र मदुरांतकम',
    },
    category: 'chc',
    district: 'Chengalpattu',
    state: 'Tamil Nadu',
    pinCode: '603306',
    address: {
      en: 'Hospital Road, Madurantakam 603306',
      ta: 'மருத்துவமனை சாலை, மதுராந்தகம் 603306',
      hi: 'अस्पताल रोड, मदुरांतकम 603306',
    },
    distanceKm: 75.0,
    departments: ['General Medicine', 'Obstetrics', 'Paediatrics', 'Dental'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY', 'CMCHIS'],
    contactPhone: '044-0000-0105',
    openingHours: 'Daily 08:00-20:00',
    diagnosticServices: ['ECG', 'Blood Lab'],
    accessibilityInfo: 'Wheelchair access',
    verifiedDate: '2026-10-14',
    isDemo: true,
    latitude: 12.512,
    longitude: 79.885,
    isPartner: false,
  },
  {
    id: 'fac-cgp-gh',
    name: 'Demo Government Hospital Chengalpattu',
    nativeNames: {
      en: 'Demo Government Hospital Chengalpattu',
      ta: 'மாதிரி அரசு தலைமை மருத்துவமனை செங்கல்பட்டு',
      hi: 'डेमो राजकीय अस्पताल चेंगलपट्टू',
    },
    category: 'government',
    district: 'Chengalpattu',
    state: 'Tamil Nadu',
    pinCode: '603001',
    address: {
      en: 'GST Road, Chengalpattu 603001',
      ta: 'ஜிஎஸ்டி சாலை, செங்கல்பட்டு 603001',
      hi: 'जीएसटी रोड, चेंगलपट्टू 603001',
    },
    distanceKm: 58.0,
    departments: ['General Medicine', 'Obstetrics', 'Paediatrics', 'Ophthalmology', 'Dental', 'Orthopaedics'],
    emergency24x7: true,
    schemesSupported: ['PM-JAY', 'CMCHIS'],
    contactPhone: '044-0000-0106',
    openingHours: 'Open 24 hours',
    diagnosticServices: ['Blood Bank', 'Trauma Care'],
    accessibilityInfo: 'Full elevator and ramp access',
    verifiedDate: '2026-10-14',
    isDemo: true,
    latitude: 12.683,
    longitude: 79.977,
    isPartner: false,
  },
];

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
    district: extractDistrict(address),
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
    isDemo: false,
    latitude: f.lat ?? 0,
    longitude: f.lng ?? 0,
    isPartner: f.is_partner,
  };
}

export const hospitalService = {
  async load(coords?: UserCoordinates): Promise<void> {
    let loaded: Hospital[] = [];
    try {
      const apiFacilities = await api.facilities(coords);
      if (Array.isArray(apiFacilities) && apiFacilities.length > 0) {
        loaded = apiFacilities.map(toHospital);
        lastError = '';
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Could not load hospitals.';
    }

    // Always merge default facilities to ensure regional coverage (Chennai/Maduravoyal, Udumalpet, etc.)
    const existingNames = new Set(loaded.map((h) => h.name.toLowerCase()));
    for (const def of DEFAULT_FACILITIES) {
      if (!existingNames.has(def.name.toLowerCase())) {
        loaded.push(def);
      }
    }

    // Calculate real distances based on live coordinates
    if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
      hospitals = locationService.computeDistances(loaded, coords);
    } else {
      hospitals = loaded;
    }
  },

  getError(): string {
    return lastError;
  },

  getAll(): Hospital[] {
    if (!hospitals.length) {
      return DEFAULT_FACILITIES;
    }
    return hospitals;
  },

  getById(id: string): Hospital | undefined {
    return (hospitals.length ? hospitals : DEFAULT_FACILITIES).find((h) => h.id === id);
  },

  search(
    query: string,
    filters?: {
      category?: 'government' | 'phc' | 'private' | 'all';
      scheme?: 'PM-JAY' | 'CMCHIS' | 'all';
      emergencyOnly?: boolean;
    }
  ): Hospital[] {
    let result = [...(hospitals.length ? hospitals : DEFAULT_FACILITIES)];

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
