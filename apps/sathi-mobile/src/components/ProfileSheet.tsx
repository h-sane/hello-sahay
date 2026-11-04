import React from 'react';
import {
  FileText,
  HelpCircle,
  LogOut,
  Pencil,
  Settings,
  Shield,
  ShieldCheck,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { HelperProfile, NavTab } from '../types';

interface ProfileSheetProps {
  profile: HelperProfile;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
  onLogout: () => void;
  onOpenEditProfile: () => void;
}

export const ProfileSheet: React.FC<ProfileSheetProps> = ({
  profile,
  isOpen,
  onClose,
  onNavigate,
  onLogout,
  onOpenEditProfile,
}) => {
  if (!isOpen) return null;

  const statusColor = {
    verified: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    pending: 'text-amber-700 bg-amber-50 border-amber-200',
    rejected: 'text-rose-700 bg-rose-50 border-rose-200',
    not_submitted: 'text-slate-600 bg-slate-100 border-slate-200',
  }[profile.id_verification.status];

  const statusLabel = {
    verified: 'Verified',
    pending: 'Verification Pending',
    rejected: 'Verification Rejected',
    not_submitted: 'ID Not Submitted',
  }[profile.id_verification.status];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1E3A2F] text-[#E8F1EC] font-bold text-lg flex items-center justify-center">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'H'}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{profile.name}</h2>
              <p className="text-xs text-slate-500">{profile.phone}</p>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}
                >
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="divide-y divide-slate-100 py-2">
          {/* Personal Information */}
          <button
            onClick={() => {
              onClose();
              onNavigate('profile');
            }}
            className="w-full flex items-center justify-between py-3 text-left hover:bg-slate-50 px-2 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#1E3A2F] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Personal Information</p>
                <p className="text-xs text-slate-500">Contact, address and emergency phone</p>
              </div>
            </div>
          </button>

          {/* Edit Profile */}
          <button
            onClick={() => {
              onClose();
              onOpenEditProfile();
            }}
            className="w-full flex items-center justify-between py-3 text-left hover:bg-slate-50 px-2 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#1E3A2F] flex items-center justify-center">
                <Pencil className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Edit Profile</p>
                <p className="text-xs text-slate-500">Update name, details and availability</p>
              </div>
            </div>
          </button>

          {/* Skills */}
          <button
            onClick={() => {
              onClose();
              onNavigate('profile');
            }}
            className="w-full flex items-center justify-between py-3 text-left hover:bg-slate-50 px-2 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#1E3A2F] flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Skills & Services</p>
                <p className="text-xs text-slate-500">{profile.skills.length} verified capabilities</p>
              </div>
            </div>
          </button>

          {/* Verification Status */}
          <div className="w-full flex items-center justify-between py-3 px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#1E3A2F] flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Verification Status</p>
                <p className="text-xs text-slate-500">
                  {profile.id_verification.id_type || 'Govt ID'}: {profile.id_verification.id_number || 'Pending'}
                </p>
              </div>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${statusColor}`}>
              {profile.id_verification.status}
            </span>
          </div>

          {/* Settings */}
          <div className="w-full flex items-center justify-between py-3 px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#1E3A2F] flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Settings</p>
                <p className="text-xs text-slate-500">App preferences, sound and notifications</p>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <a
            href="#terms"
            onClick={(e) => {
              e.preventDefault();
              alert('Sahay Sathi Helper Terms of Service: By offering services via Sahay Sathi, you agree to verified identity compliance, courteous patient care, and honest service representation.');
            }}
            className="w-full flex items-center justify-between py-3 text-left hover:bg-slate-50 px-2 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium text-slate-700">Terms and Conditions</p>
            </div>
          </a>

          {/* Privacy Policy */}
          <a
            href="#privacy"
            onClick={(e) => {
              e.preventDefault();
              alert('Sahay Sathi Privacy Policy: Your personal identity documents and phone number are securely encrypted and only shared with customers during active service bookings.');
            }}
            className="w-full flex items-center justify-between py-3 text-left hover:bg-slate-50 px-2 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium text-slate-700">Privacy Policy</p>
            </div>
          </a>

          {/* Logout */}
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center justify-between py-3 text-left hover:bg-rose-50 px-2 rounded-xl text-rose-700 transition-colors mt-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold">Logout</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

