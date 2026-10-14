import React, { useState } from 'react';
import {
  Calendar,
  Users,
  ShieldCheck,
  Settings,
  Plus,
  Trash2,
  Phone,
  ExternalLink,
  QrCode,
  CheckCircle2,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Appointment, FamilyProfile, Language, UserSettings } from '../types';
import { t } from '../translations';
import { storageService } from '../services/storageService';
import { speechService } from '../services/speechService';

interface MyHealthViewProps {
  currentLang: Language;
  userSettings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  onOpenBookingForFamily?: (familyMemberName: string) => void;
}

export const MyHealthView: React.FC<MyHealthViewProps> = ({
  currentLang,
  userSettings,
  onUpdateSettings,
  onOpenBookingForFamily,
}) => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'family' | 'schemes' | 'settings'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>(storageService.getAppointments());
  const [familyProfiles, setFamilyProfiles] = useState<FamilyProfile[]>(storageService.getFamilyProfiles());

  // Add Family Member Modal
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [famName, setFamName] = useState('');
  const [famRelation, setFamRelation] = useState<'Father' | 'Mother' | 'Spouse' | 'Child' | 'Grandparent' | 'Other'>('Mother');
  const [famAge, setFamAge] = useState(55);
  const [famGender, setFamGender] = useState<'male' | 'female' | 'other'>('female');
  const [famBlood, setFamBlood] = useState('O+');
  const [famNotes, setFamNotes] = useState('');

  // Settings
  const [userName, setUserName] = useState(userSettings.userName || 'Muthuvel');
  const [villageTown, setVillageTown] = useState(userSettings.villageTown || 'Maduranthakam');
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);

  const reloadData = () => {
    setAppointments(storageService.getAppointments());
    setFamilyProfiles(storageService.getFamilyProfiles());
  };

  const handleCancelAppointment = (id: string) => {
    if (confirm('Cancel this demo appointment?')) {
      storageService.cancelAppointment(id);
      reloadData();
      speechService.playAudioChime(420, 0.15);
    }
  };

  const handleSaveFamilyMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!famName.trim()) return;

    const newMember: FamilyProfile = {
      id: `fam-${Date.now()}`,
      fullName: famName.trim(),
      relationship: famRelation,
      age: Number(famAge) || 40,
      gender: famGender,
      bloodGroup: famBlood,
      healthConditions: famNotes.trim(),
    };

    storageService.saveFamilyProfile(newMember);
    reloadData();
    setShowAddFamilyModal(false);
    setFamName('');
    speechService.playAudioChime(750, 0.15);
  };

  const handleDeleteFamilyMember = (id: string) => {
    storageService.deleteFamilyProfile(id);
    reloadData();
  };

  const handleSaveProfileSettings = () => {
    onUpdateSettings({
      userName: userName.trim(),
      villageTown: villageTown.trim(),
    });
    setSaveSettingsSuccess(true);
    speechService.playAudioChime(800, 0.15);
    setTimeout(() => setSaveSettingsSuccess(false), 3000);
  };

  const handleClearDemoData = () => {
    if (confirm('Clear all local demo bookings and reminders?')) {
      storageService.clearAllData();
      reloadData();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('myHealthTitle', currentLang)}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1">
          Manage your hospital vouchers, family caregiver records, and government health schemes.
        </p>
      </div>

      {/* Internal Tabs (Buttons - accessible anti-pill discipline) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors touch-target ${
            activeTab === 'appointments'
              ? 'bg-white text-teal-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-teal-700" />
          <span>{t('tabAppointments', currentLang)}</span>
          <span className="text-[11px] font-mono font-bold bg-teal-50 text-teal-800 px-1.5 py-0.2 rounded-md">
            {appointments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('family')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors touch-target ${
            activeTab === 'family'
              ? 'bg-white text-teal-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-purple-700" />
          <span>{t('tabFamily', currentLang)}</span>
          <span className="text-[11px] font-mono font-bold bg-purple-50 text-purple-800 px-1.5 py-0.2 rounded-md">
            {familyProfiles.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('schemes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors touch-target ${
            activeTab === 'schemes'
              ? 'bg-white text-teal-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>{t('tabSchemes', currentLang)}</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors touch-target ${
            activeTab === 'settings'
              ? 'bg-white text-teal-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-700" />
          <span>{t('tabSettings', currentLang)}</span>
        </button>
      </div>

      {/* TAB 1: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">
                No appointment vouchers saved.
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Visit the Hospitals tab to select a government clinic or specialist and book your OPD token.
              </p>
            </div>
          ) : (
            appointments.map((apt) => {
              const isCancelled = apt.status === 'cancelled';
              return (
                <article
                  key={apt.id}
                  className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-xs space-y-4 ${
                    isCancelled
                      ? 'border-slate-200 opacity-60 bg-slate-50'
                      : 'border-slate-200 hover:border-teal-700/60'
                  }`}
                >
                  {/* Voucher Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-teal-800 font-mono text-sm">
                          {apt.referenceCode}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            isCancelled
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isCancelled ? 'Cancelled' : 'Demo Voucher Confirmed'}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1 leading-snug">
                        {apt.hospitalName}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {apt.department} · {apt.doctorName}
                      </p>
                    </div>

                    <div className="w-10 h-10 bg-slate-100 rounded-xl p-1 flex items-center justify-center shrink-0">
                      <QrCode className="w-7 h-7 text-slate-700" />
                    </div>
                  </div>

                  {/* Patient & Slot details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-slate-500 block">Patient Name:</span>
                      <span className="font-bold text-slate-900">{apt.patientName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Age:</span>
                      <span className="font-bold text-slate-900">{apt.patientAge} years</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Appointment Date:</span>
                      <span className="font-bold text-teal-900 font-mono">{apt.date}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">OPD Token Slot:</span>
                      <span className="font-bold text-teal-900 font-mono">{apt.timeSlot}</span>
                    </div>
                  </div>

                  {apt.isCaregiverAssisted && (
                    <div className="text-xs text-purple-900 bg-purple-50 p-2 rounded-xl border border-purple-100">
                      <span className="font-semibold">Caregiver Assistance:</span> {apt.caregiverName}
                    </div>
                  )}

                  {/* Actions */}
                  {!isCancelled && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleCancelAppointment(apt.id)}
                        className="text-xs font-bold text-red-700 hover:text-red-900 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                      >
                        {t('cancelAppointmentBtn', currentLang)}
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: FAMILY & CAREGIVER */}
      {activeTab === 'family' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-slate-600">
              Manage family member profiles to quickly book visits and schedule medicine reminders for parents or children.
            </p>
            <button
              onClick={() => setShowAddFamilyModal(true)}
              className="h-10 px-4 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addFamilyMember', currentLang)}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {familyProfiles.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wide">
                      {member.relationship}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      {member.fullName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {member.age} yrs · {member.gender} · Blood Group: {member.bloodGroup || 'N/A'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteFamilyMember(member.id)}
                    className="p-2 text-slate-400 hover:text-red-700 transition-colors"
                    title="Delete member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {member.healthConditions && (
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-bold">Conditions:</span> {member.healthConditions}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Authorized Caregiver Managed</span>
                  <button
                    onClick={() => onOpenBookingForFamily?.(member.fullName)}
                    className="text-xs font-bold text-teal-800 hover:underline"
                  >
                    Book for this member →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GOVERNMENT HEALTH SCHEMES */}
      {activeTab === 'schemes' && (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600">
            Verified Indian public healthcare schemes and official state portals. Note: Official enrollment must be validated via authorized CSC or government portals.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PM-JAY */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md">
                  Central Government Scheme
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  Toll-Free: 14555
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Ayushman Bharat (PM-JAY)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Offers cashless secondary and tertiary hospital treatment up to ₹5,00,000 per family per year for over 12 crore vulnerable and rural beneficiary families.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">National Health Authority (NHA)</span>
                <a
                  href="https://pmjay.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-teal-800 flex items-center gap-1 hover:underline"
                >
                  <span>pmjay.gov.in</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Tamil Nadu CMCHIS */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                  Tamil Nadu State Scheme
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  Toll-Free: 1800-425-3993
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Chief Minister's Comprehensive Health Insurance (CMCHIS)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Provides cashless treatment up to ₹5,00,000 per year for 1,090+ medical and surgical procedures across empaneled government and private hospitals in Tamil Nadu.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Govt of Tamil Nadu</span>
                <a
                  href="https://cmchistn.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-teal-800 flex items-center gap-1 hover:underline"
                >
                  <span>cmchistn.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Jan Aushadhi */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md">
                  Affordable Medicines (PMBJP)
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  Toll-Free: 1800-180-8080
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Pradhan Mantri Bhartiya Janaushadhi Pariyojana
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Over 10,000+ Jan Aushadhi Kendras operating across India offering generic medicines, surgical items, and nutraceuticals at 50% to 90% discount compared to private branded drugs.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Pharmaceuticals & Medical Devices Bureau</span>
                <a
                  href="https://janaushadhi.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-teal-800 flex items-center gap-1 hover:underline"
                >
                  <span>janaushadhi.gov.in</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* eSanjeevani */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-md">
                  National Teleconsultation
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  Toll-Free: 1075
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                eSanjeevani National Telemedicine Service
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Connects rural patients and community health officers to doctors and specialists via free digital video consultation from home or the local Ayushman Arogya Mandir.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Ministry of Health & Family Welfare</span>
                <a
                  href="https://esanjeevani.mohfw.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-teal-800 flex items-center gap-1 hover:underline"
                >
                  <span>esanjeevani.mohfw.gov.in</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS & PRIVACY */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Patient Profile Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Patient Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Village / Town / District</label>
                <input
                  type="text"
                  value={villageTown}
                  onChange={(e) => setVillageTown(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfileSettings}
              className="h-11 px-5 rounded-xl bg-teal-800 text-white font-bold text-sm shadow-xs"
            >
              Save Profile Updates
            </button>

            {saveSettingsSuccess && (
              <span className="text-xs font-bold text-emerald-800 block">
                Profile details saved successfully!
              </span>
            )}
          </div>

          {/* Reset / Clear Demo Data */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="text-lg font-bold text-slate-900">Privacy & Local Storage</h3>
            <p className="text-xs text-slate-600">
              Hello Sahay stores all appointments, reminders, and family records locally on your device. Clearing data will reset demo records to initial state.
            </p>
            <button
              onClick={handleClearDemoData}
              className="h-11 px-4 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('clearLocalDataBtn', currentLang)}</span>
            </button>
          </div>
        </div>
      )}

      {/* ADD FAMILY MEMBER MODAL */}
      {showAddFamilyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 bg-purple-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">{t('addFamilyMember', currentLang)}</h3>
              <button
                onClick={() => setShowAddFamilyModal(false)}
                className="p-1.5 rounded-xl text-purple-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFamilyMember} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {t('memberNameLabel', currentLang)} *
                </label>
                <input
                  type="text"
                  required
                  value={famName}
                  onChange={(e) => setFamName(e.target.value)}
                  placeholder="e.g. லட்சுமி அம்மாள்"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {t('memberRelationLabel', currentLang)}
                  </label>
                  <select
                    value={famRelation}
                    onChange={(e) => setFamRelation(e.target.value as any)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                  >
                    <option value="Father">Father (தந்தை)</option>
                    <option value="Mother">Mother (தாய்)</option>
                    <option value="Spouse">Spouse (மனைவி/கணவன்)</option>
                    <option value="Child">Child (மகன்/மகள்)</option>
                    <option value="Grandparent">Grandparent (தாத்தா/பாட்டி)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {t('memberAgeLabel', currentLang)}
                  </label>
                  <input
                    type="number"
                    value={famAge}
                    onChange={(e) => setFamAge(parseInt(e.target.value, 10) || 0)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Health Conditions (Optional)
                </label>
                <input
                  type="text"
                  value={famNotes}
                  onChange={(e) => setFamNotes(e.target.value)}
                  placeholder="e.g. Diabetes, BP, Joint pain"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddFamilyModal(false)}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-purple-800 text-white font-bold text-xs shadow-md"
                >
                  {t('saveMemberBtn', currentLang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
