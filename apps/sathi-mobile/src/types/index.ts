export type NavTab = 'home' | 'bookings' | 'earnings' | 'calendar' | 'profile';

export type BookingStatus =
  | 'new_request'
  | 'upcoming'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface HelperAddress {
  house_no: string | null;
  street: string | null;
  area: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  full_address: string;
}

export interface IdVerification {
  id_type: string | null;
  id_number: string | null;
  id_document_url: string | null;
  status: 'not_submitted' | 'pending' | 'verified' | 'rejected';
}

export interface HelperProfile {
  id: number;
  phone: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  email: string | null;
  profile_photo_url: string | null;
  address: HelperAddress;
  id_verification: IdVerification;
  categories: string[];
  description: string | null;
  skills: string[];
  experience_years: number;
  languages: string[];
  emergency_contact: string | null;
  is_online: boolean;
  rating: number;
  completed_count: number;
  created_at: string | null;
}

export interface ServiceBooking {
  id: number;
  booking_ref: string;
  service_category: string;
  service_title: string;
  description: string | null;
  booking_date: string;
  booking_time: string;
  location_address: string;
  location_lat: number | null;
  location_lng: number | null;
  status: BookingStatus;
  amount: number;
  payment_status: 'pending' | 'completed';
  payment_method: 'cash' | 'upi';
  customer_notes: string | null;
  helper_notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  customer: {
    id: number | null;
    name: string;
    phone: string;
    village: string;
  } | null;
}

export interface Transaction {
  id: number;
  booking_ref: string;
  service_name: string;
  category: string;
  amount: number;
  payment_status: 'pending' | 'completed';
  payment_method: string;
  date: string;
  completed_at: string | null;
}

export interface EarningsData {
  today_earnings: number;
  weekly_earnings: number;
  monthly_earnings: number;
  total_earnings: number;
  pending_earnings: number;
  completed_count: number;
  transactions: Transaction[];
}

export interface AvailabilityData {
  is_online: boolean;
  working_days: string[];
  working_hours_start: string;
  working_hours_end: string;
  unavailable_dates: string[];
}

export interface HelperNotification {
  id: number;
  kind:
    | 'new_request'
    | 'booking_accepted'
    | 'booking_rejected'
    | 'reminder'
    | 'completed'
    | 'payment_update';
  title: string;
  body: string | null;
  booking_id: number | null;
  read: boolean;
  created_at: string | null;
}

export interface SkillsCatalog {
  categories: string[];
  catalog: Record<string, string[]>;
  all_skills: Array<{ category: string; skill: string }>;
}

