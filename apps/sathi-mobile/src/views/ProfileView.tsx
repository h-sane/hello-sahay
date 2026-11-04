import React, { useState } from 'react';
import {
  Check,
  FileCheck2,
  Globe,
  Home,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Power,
  ShieldCheck,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { HelperProfile } from '../types';

interface ProfileViewProps {
  profile: HelperProfile;
  isEditing?: boolean;
  onUpdateProfile: (data: Partial<HelperProfile>) => Promise<void>;
  onLogout: () => void;
  onCloseEdit?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  isEditing: initialEditing = false,
  onUpdateProfile,
  onLogout,
  onCloseEdit,
}) => {
  const [editing, setEditing] = useState(initialEditing);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email || '');
  const [houseNo, setHouseNo] = useState(profile.address?.house_no || '');
  const [street, setStreet] = useState(profile.address?.street || '');
  const [area, setArea] = useState(profile.address?.area || '');
  const [city, setCity] = useState(profile.address?.city || '');
  const [district, setDistrict] = useState(profile.address?.district || '');
  const [state, setState] = useState(profile.address?.state || 'Tamil Nadu');
  const [pincode, setPincode] = useState(profile.address?.pincode || '');
  const [experienceYears, setExperienceYears] = useState(profile.experience_years);
  const [emergencyContact, setEmergencyContact] = useState(profile.emergency_contact || '');
  const [description, setDescription] = useState(profile.description || '');
  const [busy, setBusy] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const statusColor = {
    verified: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    pending: 'text-amber-700 bg-amber-50 border-amber-200',
    rejected: 'text-rose-700 bg-rose-50 border-rose-200',
    not_submitted: 'text-slate-600 bg-slate-100 border-slate-200',
  }[profile.id_verification.status];

  const statusLabel = {
    verified: 'Government ID Verified',
    pending: 'Verification Under Review',
    rejected: 'Verification Rejected',
    not_submitted: 'ID Not Submitted',
  }[profile.id_verification.status];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setSavedSuccess(false);
    try {
      await onUpdateProfile({
        name: name.trim(),
        email: email.trim() || null,
        address: {
          house_no: houseNo,
          street,
          area,
          city,
          district,
          state,
          pincode,
          full_address: [houseNo, street, area, city, district, state, pincode].filter(Boolean).join(', '),
        },
        experience_years: experienceYears,
        emergency_contact: emergencyContact.trim(),
        description: description.trim(),
      });
      setSavedSuccess(true);
      setEditing(false);
      if (onCloseEdit) onCloseEdit();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs text-center relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-[#1E3A2F] text-[#E8F1EC] mx-auto flex items-center justify-center font-extrabold text-2xl shadow-md border-4 border-[#E8F1EC]">
          {profile.name ? profile.name.charAt(0).toUpperCase() : 'H'}
        </div>

        <h1 className="text-lg font-extrabold text-slate-900 mt-3">{profile.name}</h1>
        <p className="text-xs text-slate-500 font-medium">{profile.phone}</p>

        <div className="mt-2.5 flex items-center justify-center gap-2">
          <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border ${statusColor}`}>
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            {statusLabel}
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              profile.is_online
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {profile.is_online ? '● Online' : '○ Offline'}
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-around text-center">
          <div>
            <span className="text-lg font-extrabold text-slate-900">
              {profile.completed_count}
            </span>
            <span className="text-[11px] text-slate-400 block font-medium">Services Done</span>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div>
            <span className="text-lg font-extrabold text-slate-900">
              ★ {profile.rating}
            </span>
            <span className="text-[11px] text-slate-400 block font-medium">Customer Rating</span>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div>
            <span className="text-lg font-extrabold text-slate-900">
              {profile.experience_years}y
            </span>
            <span className="text-[11px] text-slate-400 block font-medium">Experience</span>
          </div>
        </div>
      </div>

      {/* Edit / View Toggle */}
      {!editing ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8F1EC] text-[#1E3A2F] text-xs font-bold hover:bg-[#d5e7dd] transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>

          {/* Contact & Address */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Contact & Address
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-900">{profile.phone}</span>
              </div>
              {profile.email && (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{profile.email}</span>
                </div>
              )}
              <div className="flex items-start gap-2.5 text-slate-700">
                <MapPin className="w-4 h-4 text-[#1E3A2F] shrink-0 mt-0.5" />
                <span>{profile.address?.full_address || 'Address provided during registration'}</span>
              </div>
              {profile.emergency_contact && (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <span className="text-slate-400 font-bold text-[11px]">SOS:</span>
                  <span>Emergency contact: {profile.emergency_contact}</span>
                </div>
              )}
            </div>
          </div>

          {/* Registered Skills & Bio */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Registered Skills ({profile.skills.length})
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-full bg-[#E8F1EC] text-[#1E3A2F] text-xs font-bold border border-[#1E3A2F]/15"
                >
                  {s}
                </span>
              ))}
            </div>

            {profile.description && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  About Me
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">{profile.description}</p>
              </div>
            )}
          </div>

          {/* Government ID & Languages */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Identity & Languages
            </h2>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Identity Document</span>
              <span className="font-bold text-slate-800">
                {profile.id_verification.id_type} ({profile.id_verification.id_number || 'Verified'})
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Languages</span>
              <span className="font-bold text-slate-800">{profile.languages.join(', ')}</span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full h-11 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-2 active:bg-rose-100 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout from Sahay Sathi
          </button>
        </div>
      ) : (
        /* Edit Form */
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Edit Profile Details</h2>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A2F]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A2F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Street</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A2F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A2F]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A2F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">About / Bio</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A2F]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                className="w-full h-11 rounded-2xl bg-[#1E3A2F] text-white font-bold text-xs flex items-center justify-center gap-2 active:bg-[#162C23] shadow-xs"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

