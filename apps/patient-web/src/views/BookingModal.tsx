import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  X,
  Building2,
  Stethoscope,
  HeartHandshake,
  QrCode,
  BellRing,
  AlertCircle,
} from 'lucide-react';
import { Appointment, Doctor, Hospital, Language } from '../types';
import { t } from '../translations';
import { hospitalService } from '../services/hospitalService';
import { storageService } from '../services/storageService';
import { speechService } from '../services/speechService';

interface BookingModalProps {
  hospital: Hospital;
  currentLang: Language;
  isOnline: boolean;
  onClose: () => void;
  onBookingComplete: (appointment: Appointment) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  hospital,
  currentLang,
  isOnline,
  onClose,
  onBookingComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedDept, setSelectedDept] = useState<string>(hospital.departments[0] || 'General Medicine');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('Any Available OPD Doctor');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Tomorrow by default
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string>('09:30 AM');
  
  // Patient details
  const settings = storageService.getSettings();
  const familyProfiles = storageService.getFamilyProfiles();
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('self');
  const [patientName, setPatientName] = useState<string>(settings.userName || 'Muthuvel');
  const [patientAge, setPatientAge] = useState<number>(58);
  const [patientPhone, setPatientPhone] = useState<string>('98401XXXXX');
  const [isCaregiverAssisted, setIsCaregiverAssisted] = useState<boolean>(true);
  const [caregiverName, setCaregiverName] = useState<string>('கார்த்திக் (மகன் / Son)');
  
  // Confirmed result
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const doctors = hospitalService.getDoctorsForHospital(hospital.id, selectedDept);
  const availableSlots = hospitalService.getAvailableSlots();

  const handleFamilyMemberChange = (id: string) => {
    setSelectedFamilyId(id);
    if (id === 'self') {
      setPatientName(settings.userName || 'Muthuvel');
      setPatientAge(58);
    } else {
      const fam = familyProfiles.find((f) => f.id === id);
      if (fam) {
        setPatientName(fam.fullName);
        setPatientAge(fam.age);
      }
    }
  };

  const handleConfirmBooking = () => {
    if (!patientName.trim()) {
      setErrorMsg('Please enter the patient full name.');
      return;
    }
    if (!patientPhone.trim()) {
      setErrorMsg('Please enter a mobile phone number for the OPD token.');
      return;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const refCode = `HS-${hospital.district.slice(0, 3).toUpperCase()}-${randomSuffix}`;

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      hospitalId: hospital.id,
      hospitalName: hospital.nativeNames[currentLang] || hospital.name,
      department: selectedDept,
      doctorName: selectedDoctor,
      date: selectedDate,
      timeSlot: selectedSlot,
      patientName: patientName.trim(),
      patientAge: Number(patientAge) || 45,
      patientPhone: patientPhone.trim(),
      familyMemberId: selectedFamilyId !== 'self' ? selectedFamilyId : undefined,
      isCaregiverAssisted,
      caregiverName: isCaregiverAssisted ? caregiverName : undefined,
      status: isOnline ? 'confirmed_demo' : 'pending_sync',
      referenceCode: refCode,
      createdAt: new Date().toISOString(),
      isDemo: true,
    };

    storageService.saveAppointment(newAppointment);
    setCreatedAppointment(newAppointment);
    setStep(5);
    speechService.playAudioChime(800, 0.2);
    onBookingComplete(newAppointment);
  };

  const handleAddAppointmentReminder = () => {
    if (!createdAppointment) return;
    storageService.saveReminder({
      id: `rem-apt-${Date.now()}`,
      medicineName: `மருத்துவ சந்திப்பு: ${createdAppointment.hospitalName}`,
      dosage: `${createdAppointment.department} (${createdAppointment.timeSlot})`,
      instructions: `டோக்கன்: ${createdAppointment.referenceCode} - மருத்துவமனை பதிவு கவுண்டரில் காட்டவும்`,
      times: ['08:00'],
      frequency: 'daily',
      durationDays: 1,
      startDate: createdAppointment.date,
      status: 'active',
      lastTakenTimestamp: null,
      adherenceHistory: [],
      familyMemberName: createdAppointment.patientName,
    });
    alert('Appointment reminder successfully added to your Dose Reminders!');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-900 to-teal-800 text-white flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
              {hospital.district} · {hospital.category.toUpperCase()}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold leading-tight">
              {hospital.nativeNames[currentLang] || hospital.name}
            </h2>
            <p className="text-xs text-teal-100 flex items-center gap-1.5 pt-0.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>{t('bookingSubtitle', currentLang)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step progress indicator */}
        {step < 5 && (
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
            <button
              onClick={() => setStep(1)}
              className={step === 1 ? 'text-teal-900 underline' : 'hover:text-slate-900'}
            >
              {t('stepSpecialty', currentLang)}
            </button>
            <span className="text-slate-300">›</span>
            <button
              onClick={() => setStep(2)}
              className={step === 2 ? 'text-teal-900 underline' : 'hover:text-slate-900'}
            >
              {t('stepDoctor', currentLang)}
            </button>
            <span className="text-slate-300">›</span>
            <button
              onClick={() => setStep(3)}
              className={step === 3 ? 'text-teal-900 underline' : 'hover:text-slate-900'}
            >
              {t('stepDateTime', currentLang)}
            </button>
            <span className="text-slate-300">›</span>
            <button
              onClick={() => setStep(4)}
              className={step === 4 ? 'text-teal-900 underline' : 'hover:text-slate-900'}
            >
              {t('stepPatient', currentLang)}
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* STEP 1: Department Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {t('selectDepartment', currentLang)}
                </h3>
                <p className="text-xs text-slate-500">
                  Choose the specialized outpatient clinic for your health checkup.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {hospital.departments.map((dept) => {
                  const isSelected = selectedDept === dept;
                  return (
                    <button
                      key={dept}
                      onClick={() => {
                        setSelectedDept(dept);
                        setSelectedDoctor('Any Available OPD Doctor');
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-left font-bold text-sm transition-all flex items-center justify-between min-h-[52px] ${
                        isSelected
                          ? 'border-teal-700 bg-teal-50 text-teal-950 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <span>{dept}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Doctor Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {t('selectDoctor', currentLang)}
                </h3>
                <p className="text-xs text-slate-500">
                  Select a duty physician or continue with any duty doctor.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Default option: Any doctor */}
                <button
                  onClick={() => setSelectedDoctor('Any Available OPD Doctor')}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    selectedDoctor === 'Any Available OPD Doctor'
                      ? 'border-teal-700 bg-teal-50 text-teal-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Stethoscope className="w-5 h-5 text-teal-700" />
                    <div>
                      <span className="font-bold block">Any Available OPD Medical Officer</span>
                      <span className="text-xs text-slate-500">Shortest waiting queue in OPD</span>
                    </div>
                  </div>
                  {selectedDoctor === 'Any Available OPD Doctor' && (
                    <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0" />
                  )}
                </button>

                {/* Specific doctors */}
                {doctors.map((doc: Doctor) => {
                  const isSelected = selectedDoctor === doc.name;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc.name)}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-teal-700 bg-teal-50 text-teal-950 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">{doc.name}</span>
                        <p className="text-xs text-slate-600">
                          {doc.qualification} · {doc.experienceYears} yrs experience
                        </p>
                        <p className="text-xs text-teal-800 font-medium">
                          Available: {doc.availableDays.join(', ')} ({doc.opdTimings})
                        </p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Date & Time Slot */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {t('stepDateTime', currentLang)}
                </h3>
                <p className="text-xs text-slate-500">
                  Choose your preferred consultation date and morning OPD token slot.
                </p>
              </div>

              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-700" />
                  <span>{t('selectDate', currentLang)}</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-teal-700 font-bold text-slate-900 bg-white"
                />
              </div>

              {/* Slots Grid */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-700" />
                  <span>{t('selectSlot', currentLang)}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`h-11 rounded-xl border-2 font-bold text-xs sm:text-sm transition-all flex items-center justify-center ${
                          isSelected
                            ? 'border-teal-700 bg-teal-800 text-white shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Patient Details & Caregiver Option */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {t('stepPatient', currentLang)}
                </h3>
                <p className="text-xs text-slate-500">
                  Enter patient credentials. You can also book for parents or family members.
                </p>
              </div>

              {/* Family member quick selector */}
              {familyProfiles.length > 0 && (
                <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-2">
                  <span className="text-xs font-bold text-purple-900 block">
                    Book for Saved Family Profile:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleFamilyMemberChange('self')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        selectedFamilyId === 'self'
                          ? 'bg-purple-800 text-white'
                          : 'bg-white text-purple-950 border border-purple-200'
                      }`}
                    >
                      Myself ({settings.userName || 'Muthuvel'})
                    </button>
                    {familyProfiles.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleFamilyMemberChange(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          selectedFamilyId === f.id
                            ? 'bg-purple-800 text-white'
                            : 'bg-white text-purple-950 border border-purple-200'
                        }`}
                      >
                        {f.fullName} ({f.relationship})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Name & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {t('patientNameLabel', currentLang)} *
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold"
                    placeholder="Full name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {t('patientAgeLabel', currentLang)} *
                  </label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(parseInt(e.target.value, 10) || 0)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold"
                    placeholder="Years"
                  />
                </div>
              </div>

              {/* Mobile Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {t('patientPhoneLabel', currentLang)} *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 text-sm font-semibold font-mono"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              {/* Caregiver / ASHA assistance check */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCaregiverAssisted}
                    onChange={(e) => setIsCaregiverAssisted(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-teal-700 rounded"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4 text-teal-700" />
                      {t('isCaregiverAssisting', currentLang)}
                    </span>
                    {isCaregiverAssisted && (
                      <input
                        type="text"
                        value={caregiverName}
                        onChange={(e) => setCaregiverName(e.target.value)}
                        placeholder="Caregiver Name and Relationship"
                        className="w-full h-9 mt-2 px-3 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                      />
                    )}
                  </div>
                </label>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: VOUCHER SUCCESS SCREEN */}
          {step === 5 && createdAppointment && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 mb-2">
                  Simulated Demo Booking Voucher
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {t('bookingSuccessTitle', currentLang)}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Reference code recorded in device storage for your hospital visit.
                </p>
              </div>

              {/* Printable OPD Token Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border-2 border-dashed border-teal-800/40 text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block">
                      {t('tokenNumber', currentLang)}
                    </span>
                    <span className="text-2xl font-black text-teal-900 tracking-wider font-mono">
                      {createdAppointment.referenceCode}
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl border border-slate-300 p-1 flex items-center justify-center">
                    <QrCode className="w-9 h-9 text-slate-800" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-500 block">Patient Name:</span>
                    <span className="font-bold text-slate-900">{createdAppointment.patientName} ({createdAppointment.patientAge}y)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hospital:</span>
                    <span className="font-bold text-slate-900 line-clamp-1">{createdAppointment.hospitalName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Department:</span>
                    <span className="font-bold text-slate-900">{createdAppointment.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Date & Slot:</span>
                    <span className="font-bold text-teal-900 font-mono">{createdAppointment.date} · {createdAppointment.timeSlot}</span>
                  </div>
                </div>

                {createdAppointment.isCaregiverAssisted && (
                  <div className="text-xs text-purple-900 bg-purple-50 p-2 rounded-lg">
                    <span className="font-semibold">Caregiver Assisted by:</span> {createdAppointment.caregiverName}
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-600 bg-teal-50/80 p-3 rounded-xl border border-teal-200 text-left">
                {t('bookingNotice', currentLang)}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleAddAppointmentReminder}
                  className="w-full sm:flex-1 h-12 rounded-xl border border-teal-700 bg-teal-50 hover:bg-teal-100 text-teal-950 font-bold text-sm flex items-center justify-center gap-2"
                >
                  <BellRing className="w-4 h-4 text-teal-700" />
                  <span>{t('addToRemindersBtn', currentLang)}</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:flex-1 h-12 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm flex items-center justify-center shadow-md"
                >
                  <span>{t('viewInMyAppointments', currentLang)}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step < 5 && (
          <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="h-11 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as any)}
                className="h-12 px-6 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm shadow-xs flex items-center gap-2"
              >
                <span>Continue</span>
                <span>→</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="h-12 px-6 rounded-xl bg-teal-800 hover:bg-teal-900 active:scale-98 text-white font-bold text-base shadow-md flex items-center gap-2"
              >
                <span>{t('bookNowBtn', currentLang)}</span>
                <CheckCircle2 className="w-5 h-5 text-teal-300" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
