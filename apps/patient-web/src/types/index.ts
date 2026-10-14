export type Language = 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'bn' | 'mr' | 'gu' | 'en';

export interface UserCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  districtDetected?: string;
  isLocating?: boolean;
  error?: string;
}

export interface Hospital {
  id: string;
  name: string;
  nativeNames: Partial<Record<Language, string>> & { en: string; hi: string; ta: string };
  category: 'government' | 'phc' | 'private' | 'chc';
  district: string;
  state: string;
  pinCode: string;
  address: Partial<Record<Language, string>> & { en: string; hi: string; ta: string };
  distanceKm: number;
  departments: string[];
  emergency24x7: boolean;
  schemesSupported: ('PM-JAY' | 'CMCHIS')[];
  contactPhone: string;
  openingHours: string;
  diagnosticServices: string[];
  accessibilityInfo: string;
  verifiedDate: string;
  isDemo: boolean;
  latitude: number;
  longitude: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospitalId: string;
  qualification: string;
  experienceYears: number;
  availableDays: string[];
  opdTimings: string;
}

export interface AppointmentSlot {
  time: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  hospitalId: string;
  hospitalName: string;
  department: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  patientName: string;
  patientAge: number;
  patientPhone: string;
  familyMemberId?: string;
  isCaregiverAssisted: boolean;
  caregiverName?: string;
  status: 'confirmed_demo' | 'pending_sync' | 'cancelled';
  referenceCode: string;
  createdAt: string;
  isDemo: boolean;
}

export interface JanAushadhiEquivalent {
  brandName: string;
  price: number;
  pricePerUnit: number;
  packSize: string;
  savingsPercent: number;
  storeAvailability: string;
  salts: string;
}

export interface Medicine {
  id: string;
  brandName: string;
  genericSalts: string;
  strength: string;
  dosageForm: string;
  packSize: string;
  manufacturer: string;
  mrpPrice: number;
  pricePerUnit: number;
  janAushadhiEquivalent: JanAushadhiEquivalent;
  safetyDisclaimer: string;
  verifiedDate: string;
  uses: Partial<Record<Language, string>> & { en: string; hi: string; ta: string };
  exactSaltMatch: boolean;
}

export interface AdherenceRecord {
  date: string;
  time: string;
  status: 'taken' | 'snoozed' | 'skipped';
}

export interface Reminder {
  id: string;
  medicineName: string;
  dosage: string;
  instructions: string;
  times: string[]; // e.g. ["08:00", "20:00"]
  frequency: 'daily' | 'twice' | 'thrice' | 'as_needed';
  durationDays: number;
  startDate: string;
  status: 'active' | 'paused' | 'completed';
  lastTakenTimestamp: string | null;
  adherenceHistory: AdherenceRecord[];
  familyMemberName?: string;
}

export interface FamilyProfile {
  id: string;
  fullName: string;
  relationship: 'Self' | 'Father' | 'Mother' | 'Spouse' | 'Child' | 'Grandparent' | 'Other';
  age: number;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  healthConditions?: string;
}

export interface SahayAiAdvice {
  id: string;
  title: Partial<Record<Language, string>> & { en: string; hi: string; ta: string };
  advice: Partial<Record<Language, string>> & { en: string; hi: string; ta: string };
  category: 'seasonal' | 'chronic' | 'maternal' | 'firstaid';
  urgent: boolean;
  actionStep: Partial<Record<Language, string>> & { en: string; hi: string; ta: string };
}

export interface DoctorConsultation {
  assessment: string;
  homeCare: string;
  medicineGuidance: string;
  warningSigns: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'sahay';
  text: string;
  timestamp: string;
  emergency?: boolean;
  sources?: string[];
  isAiGenerated?: boolean;
  doctorConsultation?: DoctorConsultation;
  recommendedHospital?: Hospital;
  recommendedDepartment?: string;
  recommendedReason?: string;
}

export interface UserSettings {
  language: Language;
  hasConsented: boolean;
  locationPermission: boolean;
  microphonePermission: boolean;
  notificationsPermission: boolean;
  userName?: string;
  villageTown?: string;
}
