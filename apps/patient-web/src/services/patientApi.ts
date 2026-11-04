import { request } from './api';

export interface CarePlanInfo {
  id: number;
  payer_phone: string;
  payer_name: string | null;
  parent_phone: string;
  parent_name: string | null;
  amount_rs: number;
  paid_at: string;
}

export interface CareMe {
  is_pro: boolean;
  monitored_by: CarePlanInfo | null;
  paying_for: CarePlanInfo[];
  unread: number;
  plan_price_rs: number;
}

export interface FamilyMemberRow {
  id: number;
  name: string;
  phone: string | null;
  relation: string | null;
}

export interface ParentStatus {
  plan_id: number;
  phone: string;
  name: string | null;
  signed_in: boolean;
  medicines: number;
  doses_today: number;
  taken_today: number;
  next_appointment: { start: string; hospital: string | null } | null;
}

export interface NotificationRow {
  id: number;
  kind: 'care_plan' | 'medicine_taken' | 'appointment';
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

export interface ReminderRow {
  id: number;
  medicine_name: string;
  times: string[];
  active: boolean;
  taken_today: string[];
}

export interface Contacts {
  helpline: string;
  emergency: string;
  hospital_call: string;
  ambulance: string;
  national_emergency: string;
}

export interface MedicineEquivalent {
  name: string;
  pack: string | null;
  price_rs: number;
  saving_percent: number | null;
}

export interface MedicineItem {
  id?: number;
  brand: string | null;
  composition: string | null;
  form: string | null;
  manufacturer: string | null;
  pack: string | null;
  price_rs: number | null;
  price_from?: 'label' | 'dataset' | null;
  jan_aushadhi: MedicineEquivalent | null;
}

export interface MedicineSearch {
  query: string;
  corrected_to: string | null;
  note: string;
  brands: MedicineItem[];
  generics: { name: string; pack: string | null; price_rs: number; group: string | null }[];
}

export interface MedicineScan {
  status: 'found' | 'no_equivalent' | 'brand_only' | 'unreadable';
  read: { brand: string | null; composition: string | null; form: string | null; pack: string | null; price_rs: number | null; manufacturer: string | null };
  matches: MedicineItem[];
  note?: string;
}

export interface ServiceProvider {
  id: number;
  name: string;
  photo: string | null;
  rating: number;
  jobs_done: number;
  experience_years: number;
  languages: string[];
  description: string | null;
  skills: string[];
  rate_amount: number;
  rate_label: string;
  online: boolean;
  demo: boolean;
}

export interface ServiceBookingRow {
  id: number;
  booking_ref: string;
  service_category: string;
  service_title: string;
  description: string | null;
  booking_date: string;
  booking_time: string;
  location_address: string;
  status: 'new_request' | 'upcoming' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  amount: number;
  helper: { id: number; name: string; photo: string | null; demo: boolean; phone: string | null } | null;
}

export interface ServiceBookingIn {
  helper_id: number | null;
  service_category: string;
  service_title: string;
  description?: string;
  booking_date: string;
  slot: 'morning' | 'afternoon' | 'evening';
  location_address: string;
  customer_notes?: string;
}

export const patientApi = {
  serviceProviders: (category: string) =>
    request<ServiceProvider[]>(`/services/providers?category=${encodeURIComponent(category)}`),
  serviceBookings: () => request<ServiceBookingRow[]>('/services/bookings'),
  bookService: (b: ServiceBookingIn) => request<ServiceBookingRow>('/services/bookings', { method: 'POST', body: b }),
  cancelServiceBooking: (id: number) =>
    request<ServiceBookingRow>(`/services/bookings/${id}/cancel`, { method: 'POST' }),
  careMe: () => request<CareMe>('/care/me'),
  contacts: () => request<Contacts>('/config/contacts'),
  family: () => request<FamilyMemberRow[]>('/family'),
  addFamily: (m: { name: string; phone?: string; relation?: string }) =>
    request<FamilyMemberRow>('/family', { method: 'POST', body: m }),
  editFamily: (id: number, m: { name: string; phone?: string; relation?: string }) =>
    request<FamilyMemberRow>(`/family/${id}`, { method: 'PUT', body: m }),
  deleteFamily: (id: number) => request<null>(`/family/${id}`, { method: 'DELETE' }),
  careOrder: () =>
    request<{ mode: 'demo' } | { mode: 'razorpay'; key_id: string; order_id: string; amount: number; currency: string }>(
      '/care/order', { method: 'POST' }),
  payCarePlan: (parentPhone: string, proof: Record<string, string> = {}) =>
    request<{ already_active: boolean; plan: CarePlanInfo }>('/care/pay', { method: 'POST', body: { parent_phone: parentPhone, ...proof } }),
  stopCarePlan: (id: number) => request<null>(`/care/plans/${id}`, { method: 'DELETE' }),
  parents: () => request<ParentStatus[]>('/care/parents'),
  notifications: () => request<NotificationRow[]>('/notifications'),
  markNotificationsRead: () => request<null>('/notifications/read', { method: 'POST' }),
  reminders: () => request<ReminderRow[]>('/reminders'),
  addReminder: (r: { medicine_name: string; times: string[] }) =>
    request<ReminderRow>('/reminders', { method: 'POST', body: r }),
  editReminder: (id: number, r: { medicine_name: string; times: string[]; active: boolean }) =>
    request<ReminderRow>(`/reminders/${id}`, { method: 'PUT', body: r }),
  deleteReminder: (id: number) => request<null>(`/reminders/${id}`, { method: 'DELETE' }),
  markTaken: (id: number, atTime: string) =>
    request<ReminderRow>(`/reminders/${id}/taken`, { method: 'POST', body: { at_time: atTime } }),
  searchMedicines: (q: string) => request<MedicineSearch>(`/medicines/search?q=${encodeURIComponent(q)}&limit=12`),
  suggestMedicines: (q: string) => request<{ names: string[] }>(`/medicines/suggest?q=${encodeURIComponent(q)}`),
  scanMedicine: (image: string) => request<MedicineScan>('/medicines/scan', { method: 'POST', body: { image } }),
};
