import {
  AvailabilityData,
  EarningsData,
  HelperNotification,
  HelperProfile,
  ServiceBooking,
  SkillsCatalog,
} from '../types';

const BASE: string = (import.meta as any).env?.VITE_API_URL || '/api/v1';
const TOKEN_KEY = 'sahay_sathi_token';
const PROFILE_KEY = 'sahay_sathi_profile';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function authHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`localStorage.setItem failed for key "${key}":`, err);
    try {
      if (key === PROFILE_KEY) {
        const obj = JSON.parse(value);
        if (obj?.id_verification?.id_document_url && obj.id_verification.id_document_url.length > 200) {
          obj.id_verification.id_document_url = 'https://storage.hellosahay.com/docs/verified_document.pdf';
        }
        localStorage.removeItem(PROFILE_KEY);
        localStorage.setItem(key, JSON.stringify(obj));
        return;
      }
    } catch {
      // fallback
    }
    try {
      localStorage.removeItem(key);
      localStorage.setItem(key, value);
    } catch (e2) {
      console.error('safeSetItem fallback failed:', e2);
    }
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const err = await res.json();
      msg = err.detail || err.message || msg;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

// Demo fallback data if backend is offline or during offline testing
export const DEMO_HELPER: HelperProfile = {
  id: 1,
  phone: '+919876543210',
  name: 'Ramesh Kumar',
  gender: 'male',
  email: 'ramesh.helper@gmail.com',
  profile_photo_url: null,
  address: {
    house_no: 'No. 42',
    street: 'Gandhi Street',
    area: 'Tambaram West',
    city: 'Chennai',
    district: 'Chengalpattu',
    state: 'Tamil Nadu',
    pincode: '600045',
    full_address: 'No. 42, Gandhi Street, Tambaram West, Chennai - 600045',
  },
  id_verification: {
    id_type: 'Aadhaar Card',
    id_number: 'XXXX-XXXX-9124',
    id_document_url: null,
    status: 'verified',
  },
  categories: ['Personal Caretaker', 'Technical Support'],
  description:
    'Experienced home caretaker and basic plumbing/water maintenance technician. Over 6 years assisting seniors and rural families with dedication.',
  skills: [
    'Elderly Care',
    'Medication Reminders',
    'Vital Signs Monitoring',
    'Plumbing Repairs',
    'Water Filter Installation & Service',
  ],
  experience_years: 6,
  languages: ['English', 'Tamil', 'Hindi', 'Telugu'],
  emergency_contact: '+919876500000',
  is_online: true,
  rating: 4.9,
  completed_count: 18,
  created_at: new Date().toISOString(),
};

export const DEMO_BOOKINGS: ServiceBooking[] = [
  {
    id: 100,
    booking_ref: 'SB-2026-100',
    service_category: 'Personal Caretaker',
    service_title: 'Early Morning Patient Vitals & Dressing',
    description: 'Checked blood pressure, assisted with morning medicines and breakfast.',
    booking_date: new Date().toISOString().split('T')[0],
    booking_time: '07:00 AM - 08:30 AM',
    location_address: 'Plot 12, Muthu Street, Tambaram Sanatorium, Chennai',
    location_lat: 12.932,
    location_lng: 80.119,
    status: 'completed',
    amount: 500,
    payment_status: 'completed',
    payment_method: 'upi',
    customer_notes: null,
    helper_notes: 'Vitals normal (BP 124/82). Morning medication completed.',
    started_at: new Date(Date.now() - 14400000).toISOString(),
    completed_at: new Date(Date.now() - 7200000).toISOString(),
    customer: {
      id: 5,
      name: 'Mrs. Lakshmi Narayanan',
      phone: '+919840555666',
      village: 'Tambaram Sanatorium, Chennai',
    },
  },
  {
    id: 101,
    booking_ref: 'SB-2026-101',
    service_category: 'Personal Caretaker',
    service_title: 'Elderly Patient Caretaker & Monitoring',
    description:
      'Assist 68-year-old mother with mobility support, blood pressure check and noon meal medication.',
    booking_date: new Date().toISOString().split('T')[0],
    booking_time: '09:30 AM - 12:30 PM',
    location_address:
      'Flat 3B, Sri Krishna Apartments, Gandhi Road, Tambaram East, Chennai - 600059',
    location_lat: 12.925,
    location_lng: 80.1012,
    status: 'upcoming',
    amount: 650,
    payment_status: 'pending',
    payment_method: 'cash',
    customer_notes: 'Please ring the bell twice. Patient responds to Tamil & English.',
    helper_notes: null,
    started_at: null,
    completed_at: null,
    customer: {
      id: 1,
      name: 'Kavitha Sundaram',
      phone: '+919840123456',
      village: 'Tambaram East, Chennai',
    },
  },
  {
    id: 102,
    booking_ref: 'SB-2026-102',
    service_category: 'Technical Support',
    service_title: 'Water Filter Pipe Leakage Repair',
    description:
      'Kitchen RO water filter inlet pipe leaking continuously. Needs connector replacement and check.',
    booking_date: new Date().toISOString().split('T')[0],
    booking_time: '02:30 PM - 04:00 PM',
    location_address: 'Door 12, Anna Nagar Main Road, Tambaram, Chennai - 600045',
    location_lat: 12.921,
    location_lng: 80.098,
    status: 'new_request',
    amount: 450,
    payment_status: 'pending',
    payment_method: 'upi',
    customer_notes: 'Gate is open, please come directly to first floor.',
    helper_notes: null,
    started_at: null,
    completed_at: null,
    customer: {
      id: 2,
      name: 'Dr. S. Ranganathan',
      phone: '+919840987654',
      village: 'Anna Nagar, Tambaram',
    },
  },
  {
    id: 103,
    booking_ref: 'SB-2026-103',
    service_category: 'House Cleaning',
    service_title: 'Post-Recovery Room Deep Sanitization',
    description:
      'Complete deep cleaning and antibacterial sanitization of bedroom and adjacent bathroom after hospital discharge.',
    booking_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    booking_time: '10:00 AM - 01:00 PM',
    location_address: 'No. 18, 3rd Cross Street, GST Road, Chromepet, Chennai - 600044',
    location_lat: 12.9516,
    location_lng: 80.1462,
    status: 'upcoming',
    amount: 850,
    payment_status: 'pending',
    payment_method: 'cash',
    customer_notes: 'Bring sanitizing supplies if possible. Lift available.',
    helper_notes: null,
    started_at: null,
    completed_at: null,
    customer: {
      id: 3,
      name: 'Priya Meenakshi',
      phone: '+919444112233',
      village: 'Chromepet, Chennai',
    },
  },
  {
    id: 98,
    booking_ref: 'SB-2026-098',
    service_category: 'Personal Caretaker',
    service_title: 'Morning Routine & Physio Assistance',
    description: 'Assisted patient with walking exercise and daily medicines.',
    booking_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    booking_time: '08:00 AM - 11:00 AM',
    location_address: 'Flat 3B, Sri Krishna Apartments, Gandhi Road, Tambaram East',
    location_lat: 12.925,
    location_lng: 80.1012,
    status: 'completed',
    amount: 600,
    payment_status: 'completed',
    payment_method: 'cash',
    customer_notes: null,
    helper_notes: 'Patient completed gentle leg physiotherapy without fatigue.',
    started_at: new Date(Date.now() - 90000000).toISOString(),
    completed_at: new Date(Date.now() - 75000000).toISOString(),
    customer: {
      id: 1,
      name: 'Kavitha Sundaram',
      phone: '+919840123456',
      village: 'Tambaram East, Chennai',
    },
  },
  {
    id: 95,
    booking_ref: 'SB-2026-095',
    service_category: 'Technical Support',
    service_title: 'Bathroom Tap & Mixer Installation',
    description: 'Installed new tap fixture and verified water pressure.',
    booking_date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
    booking_time: '03:00 PM - 04:30 PM',
    location_address: 'Plot 5, Rajaji Nagar, Selaiyur, Chennai',
    location_lat: 12.918,
    location_lng: 80.132,
    status: 'completed',
    amount: 500,
    payment_status: 'completed',
    payment_method: 'upi',
    customer_notes: null,
    helper_notes: 'Fitted heavy brass valve and verified zero drip.',
    started_at: new Date(Date.now() - 265000000).toISOString(),
    completed_at: new Date(Date.now() - 255000000).toISOString(),
    customer: {
      id: 4,
      name: 'Anand Natarajan',
      phone: '+919790123450',
      village: 'Selaiyur, Chennai',
    },
  },
];

export const DEMO_NOTIFICATIONS: HelperNotification[] = [
  {
    id: 1,
    kind: 'new_request',
    title: 'New Booking Request: Water Filter Repair',
    body: 'Customer Dr. S. Ranganathan requested Technical Support for 02:30 PM today in Tambaram.',
    booking_id: 102,
    read: false,
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 2,
    kind: 'booking_accepted',
    title: 'Service Confirmed for Today',
    body: 'Elderly Patient Caretaker starts at 09:30 AM at Gandhi Road, Tambaram East.',
    booking_id: 101,
    read: true,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 3,
    kind: 'payment_update',
    title: 'Payment Received: ₹600.00',
    body: 'Cash payment confirmed for Booking #SB-2026-098.',
    booking_id: 98,
    read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const sathiApi = {
  // Auth
  async requestOtp(phone: string): Promise<{ sent: boolean; demo_code: string; is_registered: boolean }> {
    try {
      return await request<{ sent: boolean; demo_code: string; is_registered: boolean }>('/sathi/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
    } catch {
      return { sent: true, demo_code: '123456', is_registered: true };
    }
  },

  async verifyOtp(phone: string, code: string): Promise<{ token: string; is_registered: boolean; helper: HelperProfile }> {
    try {
      const res = await request<{ token: string; is_registered: boolean; helper: HelperProfile }>('/sathi/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      });
      safeSetItem(TOKEN_KEY, res.token);
      safeSetItem(PROFILE_KEY, JSON.stringify(res.helper));
      return res;
    } catch {
      const token = 'demo-helper-jwt-token';
      safeSetItem(TOKEN_KEY, token);
      safeSetItem(PROFILE_KEY, JSON.stringify(DEMO_HELPER));
      return { token, is_registered: true, helper: DEMO_HELPER };
    }
  },

  async loginPassword(identifier: string, password: string): Promise<{ token: string; helper: HelperProfile }> {
    try {
      const isEmail = identifier.includes('@');
      const payload = isEmail
        ? { email: identifier, identifier, password }
        : { phone: identifier, identifier, password };
      const res = await request<{ token: string; helper: HelperProfile }>('/sathi/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      safeSetItem(TOKEN_KEY, res.token);
      safeSetItem(PROFILE_KEY, JSON.stringify(res.helper));
      return res;
    } catch {
      const token = 'demo-helper-jwt-token';
      safeSetItem(TOKEN_KEY, token);
      const helper = {
        ...DEMO_HELPER,
        phone: identifier.includes('@') ? DEMO_HELPER.phone : (identifier.startsWith('+91') ? identifier : `+91${identifier.replace(/\D/g, '').slice(-10)}`),
        email: identifier.includes('@') ? identifier : DEMO_HELPER.email,
      };
      safeSetItem(PROFILE_KEY, JSON.stringify(helper));
      return { token, helper };
    }
  },

  async register(data: any): Promise<{ success: boolean; token: string; helper: HelperProfile }> {
    const cleanData = { ...data };
    if (cleanData.id_document_url && cleanData.id_document_url.startsWith('data:')) {
      cleanData.id_document_url = 'https://storage.hellosahay.com/docs/uploaded_id_document.pdf';
    }

    try {
      const res = await request<{ success: boolean; token: string; helper: HelperProfile }>('/sathi/register', {
        method: 'POST',
        body: JSON.stringify(cleanData),
      });
      safeSetItem(TOKEN_KEY, res.token);
      safeSetItem(PROFILE_KEY, JSON.stringify(res.helper));
      return res;
    } catch {
      const sanitizedDocUrl =
        cleanData.id_document_url || 'https://storage.hellosahay.com/docs/verified_document.pdf';

      const profile: HelperProfile = {
        ...DEMO_HELPER,
        ...cleanData,
        id_verification: {
          id_type: cleanData.id_type || 'Aadhaar Card',
          id_number: cleanData.id_number || 'XXXX-XXXX-9124',
          id_document_url: sanitizedDocUrl,
          status: 'verified',
        },
      };
      const token = 'demo-helper-jwt-token';
      safeSetItem(TOKEN_KEY, token);
      safeSetItem(PROFILE_KEY, JSON.stringify(profile));
      return { success: true, token, helper: profile };
    }
  },

  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  getSavedProfile(): HelperProfile | null {
    try {
      const str = localStorage.getItem(PROFILE_KEY);
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
  },

  // Profile
  async getProfile(): Promise<HelperProfile> {
    try {
      const p = await request<HelperProfile>('/sathi/profile');
      safeSetItem(PROFILE_KEY, JSON.stringify(p));
      return p;
    } catch {
      return this.getSavedProfile() || DEMO_HELPER;
    }
  },

  async updateProfile(data: Partial<HelperProfile>): Promise<HelperProfile> {
    try {
      const p = await request<HelperProfile>('/sathi/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      safeSetItem(PROFILE_KEY, JSON.stringify(p));
      return p;
    } catch {
      const current = this.getSavedProfile() || DEMO_HELPER;
      const updated = { ...current, ...data };
      safeSetItem(PROFILE_KEY, JSON.stringify(updated));
      return updated;
    }
  },

  // Skills
  async getSkillsCatalog(): Promise<SkillsCatalog> {
    try {
      return await request<SkillsCatalog>('/sathi/skills/catalog');
    } catch {
      return {
        categories: ['Personal Caretaker', 'House Cleaning', 'Technical Support'],
        catalog: {
          'Personal Caretaker': [
            'Elderly Care',
            'Bedridden Patient Care',
            'Post-Surgery Assistance',
            'Mobility & Walking Support',
            'Vital Signs Monitoring',
            'Medication Reminders',
            'Bathing & Grooming',
            'Feeding Assistance',
            'Special Needs Care',
          ],
          'House Cleaning': [
            'Deep Cleaning',
            'Kitchen Sanitization',
            'Bathroom Disinfection',
            'Floor Mopping & Polishing',
            'Dusting & Vacuuming',
            'Balcony & Window Cleaning',
            'Appliance Cleaning',
            'Garbage Disposal',
          ],
          'Technical Support': [
            'Plumbing Repairs',
            'Water Pipe Leakage Fix',
            'Water Filter Installation & Service',
            'Electrical Wiring & Switches',
            'Appliance Repair (Mixer, Fan, Geyser)',
            'Drain Cleaning',
            'Basic Household Maintenance',
            'Carpentry & Door Lock Repair',
          ],
        },
        all_skills: [],
      };
    }
  },

  async extractSkills(description: string): Promise<{ recognized_skills: string[]; suggestions: string[] }> {
    try {
      return await request<{ recognized_skills: string[]; suggestions: string[] }>('/sathi/skills/extract', {
        method: 'POST',
        body: JSON.stringify({ description }),
      });
    } catch {
      const desc = description.toLowerCase();
      const matched: string[] = [];
      if (desc.includes('water') || desc.includes('pipe') || desc.includes('plumb') || desc.includes('leak')) {
        matched.push('Plumbing Repairs', 'Water Pipe Leakage Fix');
      }
      if (desc.includes('filter') || desc.includes('ro')) {
        matched.push('Water Filter Installation & Service');
      }
      if (desc.includes('clean') || desc.includes('house') || desc.includes('mop')) {
        matched.push('Deep Cleaning', 'Floor Mopping & Polishing');
      }
      if (desc.includes('care') || desc.includes('elder') || desc.includes('patient') || desc.includes('walk')) {
        matched.push('Elderly Care', 'Mobility & Walking Support');
      }
      if (desc.includes('medicine') || desc.includes('bp') || desc.includes('vital')) {
        matched.push('Medication Reminders', 'Vital Signs Monitoring');
      }
      if (desc.includes('electric') || desc.includes('wire') || desc.includes('switch') || desc.includes('fan')) {
        matched.push('Electrical Wiring & Switches');
      }
      if (matched.length === 0) {
        matched.push('Basic Household Maintenance', 'Elderly Care');
      }
      return { recognized_skills: matched, suggestions: matched };
    }
  },

  // Bookings
  async getBookings(status: string = 'all'): Promise<ServiceBooking[]> {
    try {
      return await request<ServiceBooking[]>(`/sathi/bookings?status=${status}`);
    } catch {
      if (status === 'all') return DEMO_BOOKINGS;
      return DEMO_BOOKINGS.filter((b) => b.status === status);
    }
  },

  async getBookingDetails(id: number): Promise<ServiceBooking> {
    try {
      return await request<ServiceBooking>(`/sathi/bookings/${id}`);
    } catch {
      return DEMO_BOOKINGS.find((b) => b.id === id) || DEMO_BOOKINGS[0];
    }
  },

  async executeBookingAction(
    id: number,
    action: 'accept' | 'reject' | 'start' | 'complete',
    notes?: string
  ): Promise<ServiceBooking> {
    try {
      return await request<ServiceBooking>(`/sathi/bookings/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, notes }),
      });
    } catch {
      const booking = DEMO_BOOKINGS.find((b) => b.id === id) || DEMO_BOOKINGS[0];
      if (action === 'accept') booking.status = 'upcoming';
      if (action === 'reject') booking.status = 'rejected';
      if (action === 'start') {
        booking.status = 'in_progress';
        booking.started_at = new Date().toISOString();
      }
      if (action === 'complete') {
        booking.status = 'completed';
        booking.completed_at = new Date().toISOString();
        booking.payment_status = 'completed';
        booking.booking_date = new Date().toISOString().split('T')[0];
      }
      if (notes) booking.helper_notes = notes;
      return { ...booking };
    }
  },

  // Earnings
  async getEarnings(): Promise<EarningsData> {
    try {
      return await request<EarningsData>('/sathi/earnings');
    } catch {
      const todayStr = new Date().toISOString().split('T')[0];
      const completed = DEMO_BOOKINGS.filter((b) => b.status === 'completed');
      // Strictly and only tasks currently in progress count toward pending earnings
      const inProgress = DEMO_BOOKINGS.filter((b) => b.status === 'in_progress');

      const todayTotal = completed
        .filter((b) => b.booking_date === todayStr || (b.completed_at && b.completed_at.startsWith(todayStr)))
        .reduce((sum, b) => sum + b.amount, 0);

      const pendingTotal = inProgress.reduce((sum, b) => sum + b.amount, 0);
      const totalEarned = completed.reduce((sum, b) => sum + b.amount, 0) + 4200;

      // Transactions in history are completed (paid) and in-progress (pending payment)
      const allRelevant = [...DEMO_BOOKINGS]
        .filter((b) => b.status === 'completed' || b.status === 'in_progress')
        .sort((a, b) => (b.completed_at || b.booking_date || '').localeCompare(a.completed_at || a.booking_date || ''));

      return {
        today_earnings: todayTotal,
        weekly_earnings: todayTotal + 600,
        monthly_earnings: todayTotal + 1100,
        total_earnings: totalEarned,
        pending_earnings: pendingTotal,
        completed_count: completed.length + 15,
        transactions: allRelevant.map((b) => ({
          id: b.id,
          booking_ref: b.booking_ref,
          service_name: b.service_title,
          category: b.service_category,
          amount: b.amount,
          payment_status: (b.status === 'completed' || b.payment_status === 'completed') ? 'completed' : 'pending',
          payment_method: b.payment_method,
          date: b.booking_date,
          completed_at: b.completed_at,
        })),
      };
    }
  },

  // Availability
  async getAvailability(): Promise<AvailabilityData> {
    try {
      return await request<AvailabilityData>('/sathi/availability');
    } catch {
      return {
        is_online: true,
        working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        working_hours_start: '08:00',
        working_hours_end: '19:00',
        unavailable_dates: [],
      };
    }
  },

  async updateAvailability(data: Partial<AvailabilityData>): Promise<AvailabilityData> {
    try {
      return await request<AvailabilityData>('/sathi/availability', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      return {
        is_online: data.is_online ?? true,
        working_days: data.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        working_hours_start: data.working_hours_start || '08:00',
        working_hours_end: data.working_hours_end || '19:00',
        unavailable_dates: data.unavailable_dates || [],
      };
    }
  },

  // Notifications
  async getNotifications(): Promise<{ unread_count: number; notifications: HelperNotification[] }> {
    try {
      return await request<{ unread_count: number; notifications: HelperNotification[] }>('/sathi/notifications');
    } catch {
      return {
        unread_count: DEMO_NOTIFICATIONS.filter((n) => !n.read).length,
        notifications: DEMO_NOTIFICATIONS,
      };
    }
  },

  async markNotificationRead(id: number): Promise<void> {
    try {
      await request(`/sathi/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      const n = DEMO_NOTIFICATIONS.find((x) => x.id === id);
      if (n) n.read = true;
    }
  },

  // Customer Service Booking (inter-app integration)
  async customerBookService(data: any): Promise<ServiceBooking> {
    return request<ServiceBooking>('/sathi/customer/book', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

