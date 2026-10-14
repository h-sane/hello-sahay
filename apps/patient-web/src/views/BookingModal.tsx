import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Phone,
  CheckCircle2,
  X,
  Building2,
  Stethoscope,
  BellRing,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Appointment, Hospital, Language } from '../types';
import { t } from '../translations';
import { api, ApiSlot } from '../services/api';
import { appointmentService, toAppointment } from '../services/appointmentService';
import { storageService } from '../services/storageService';
import { speechService } from '../services/speechService';

interface BookingModalProps {
  hospital: Hospital;
  currentLang: Language;
  isOnline: boolean;
  onClose: () => void;
  onBookingComplete: (appointment: Appointment) => void;
}

const DAYS_AHEAD = 7;
const ANY_DOCTOR = 0;

const isoDay = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-CA');
};
const dayLabel = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

export const BookingModal: React.FC<BookingModalProps> = ({
  hospital,
  currentLang,
  isOnline,
  onClose,
  onBookingComplete,
}) => {
  const settings = storageService.getSettings();
  const familyProfiles = storageService.getFamilyProfiles();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedDept, setSelectedDept] = useState<string>(hospital.departments[0] || 'General Medicine');
  const [selectedDoctor, setSelectedDoctor] = useState<number>(ANY_DOCTOR);
  const [selectedDate, setSelectedDate] = useState<string>(isoDay(0));
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [patientName, setPatientName] = useState<string>(settings.userName || '');
  const [patientPhone, setPatientPhone] = useState<string>(settings.userPhone || '');

  const [slotsByDay, setSlotsByDay] = useState<Record<string, ApiSlot[]> | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [created, setCreated] = useState<Appointment | null>(null);
  const [reminderAdded, setReminderAdded] = useState(false);

  const bookable = hospital.isPartner !== false;

  // Open slots for the next week, fetched together so the day chips can show counts.
  const loadSlots = async () => {
    setLoadError('');
    setSlotsByDay(null);
    try {
      const days = Array.from({ length: DAYS_AHEAD }, (_, i) => isoDay(i));
      const lists = await Promise.all(days.map((d) => api.slots(Number(hospital.id), d)));
      const map = Object.fromEntries(days.map((d, i) => [d, lists[i]]));
      setSlotsByDay(map);
      const firstOpen = days.find((d) => map[d].length > 0);
      if (firstOpen) setSelectedDate(firstOpen);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load open slots.');
    }
  };

  useEffect(() => {
    if (bookable && isOnline) loadSlots();
  }, [hospital.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const sameDept = (s: ApiSlot) => s.department.toLowerCase() === selectedDept.toLowerCase();
  const deptSlots = useMemo(
    () => (slotsByDay?.[selectedDate] || []).filter(sameDept),
    [slotsByDay, selectedDate, selectedDept] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const doctors = useMemo(() => {
    const seen = new Map<number, string>();
    Object.values(slotsByDay || {})
      .flat()
      .filter(sameDept)
      .forEach((s) => seen.set(s.doctor_id, s.doctor_name));
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [slotsByDay, selectedDept]); // eslint-disable-line react-hooks/exhaustive-deps
  const shownSlots = deptSlots.filter((s) => selectedDoctor === ANY_DOCTOR || s.doctor_id === selectedDoctor);
  const countForDay = (day: string) =>
    (slotsByDay?.[day] || []).filter(
      (s) => sameDept(s) && (selectedDoctor === ANY_DOCTOR || s.doctor_id === selectedDoctor)
    ).length;

  const handleFamilyMemberChange = (id: string) => {
    if (id === 'self') {
      setPatientName(settings.userName || '');
      return;
    }
    const fam = familyProfiles.find((f) => f.id === id);
    if (fam) setPatientName(fam.fullName);
  };

  const handleConfirmBooking = async () => {
    setErrorMsg('');
    if (!patientName.trim()) return setErrorMsg('Please enter the patient full name.');
    if (!patientPhone.trim()) return setErrorMsg('Please enter a mobile number for the booking.');
    if (selectedSlot === null) return setErrorMsg('Please choose a time slot.');
    setBusy(true);
    try {
      const res = await api.book({
        patient: {
          name: patientName.trim(),
          phone: patientPhone.trim(),
          language: ['ta', 'hi', 'en'].includes(currentLang) ? currentLang : undefined,
        },
        slot_id: selectedSlot,
      });
      const appointment = toAppointment(res);
      appointmentService.remember(appointment);
      storageService.saveSettings({ userName: patientName.trim() });
      setCreated(appointment);
      setStep(5);
      speechService.playAudioChime(800, 0.2);
      onBookingComplete(appointment);
    } catch (e: any) {
      if (e?.status === 409) {
        setErrorMsg('That slot was just taken. Please choose another time.');
        setSelectedSlot(null);
        setStep(3);
        loadSlots();
      } else if (e?.status === 422) {
        setErrorMsg('Please enter a valid 10-digit mobile number.');
      } else {
        setErrorMsg(e?.message || 'Could not book. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleAddAppointmentReminder = () => {
    if (!created) return;
    storageService.saveReminder({
      id: `rem-apt-${Date.now()}`,
      medicineName: `Appointment: ${created.hospitalName}`,
      dosage: `${created.department} (${created.timeSlot})`,
      instructions: `Booking ${created.referenceCode}. Show this code at the hospital counter.`,
      times: ['08:00'],
      frequency: 'daily',
      durationDays: 1,
      startDate: created.date,
      status: 'active',
      lastTakenTimestamp: null,
      adherenceHistory: [],
      familyMemberName: created.patientName,
    });
    setReminderAdded(true);
  };

  const stepButton = (n: 1 | 2 | 3 | 4, label: string) => (
    <button
      onClick={() => setStep(n)}
      className={step === n ? 'text-teal-900 underline' : 'hover:text-slate-900'}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[95vh]">
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

        {/* Not bookable online, or no connection */}
        {(!bookable || !isOnline) && (
          <div className="p-6 space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-950 space-y-1">
              <p className="font-bold">
                {!isOnline ? 'You are offline.' : 'Online booking is not available at this facility yet.'}
              </p>
              <p>
                {!isOnline
                  ? 'Connect to the internet to book a slot.'
                  : 'Please call or visit the facility to book your visit.'}
              </p>
            </div>
            {hospital.contactPhone && (
              <a
                href={`tel:${hospital.contactPhone}`}
                className="h-12 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Call {hospital.contactPhone}</span>
              </a>
            )}
          </div>
        )}

        {bookable && isOnline && (
          <>
            {step < 5 && (
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
                {stepButton(1, t('stepSpecialty', currentLang))}
                <span className="text-slate-300">›</span>
                {stepButton(2, t('stepDoctor', currentLang))}
                <span className="text-slate-300">›</span>
                {stepButton(3, t('stepDateTime', currentLang))}
                <span className="text-slate-300">›</span>
                {stepButton(4, t('stepPatient', currentLang))}
              </div>
            )}

            <div className="p-6 overflow-y-auto space-y-6">
              {loadError && (
                <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between gap-3">
                  <span>{loadError}</span>
                  <button onClick={loadSlots} className="font-bold underline shrink-0">
                    Try again
                  </button>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{t('selectDepartment', currentLang)}</h3>
                    <p className="text-xs text-slate-500">Choose the outpatient clinic you want to visit.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {hospital.departments.map((dept) => {
                      const isSelected = selectedDept === dept;
                      return (
                        <button
                          key={dept}
                          onClick={() => {
                            setSelectedDept(dept);
                            setSelectedDoctor(ANY_DOCTOR);
                            setSelectedSlot(null);
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

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{t('selectDoctor', currentLang)}</h3>
                    <p className="text-xs text-slate-500">
                      Choose a doctor, or take the first free time with any doctor.
                    </p>
                  </div>
                  {!slotsByDay && !loadError && (
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading doctors…
                    </p>
                  )}
                  <div className="space-y-2.5">
                    {[{ id: ANY_DOCTOR, name: 'Any available doctor' }, ...doctors].map((doc) => {
                      const isSelected = selectedDoctor === doc.id;
                      return (
                        <button
                          key={doc.id}
                          onClick={() => {
                            setSelectedDoctor(doc.id);
                            setSelectedSlot(null);
                          }}
                          className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-teal-700 bg-teal-50 text-teal-950 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Stethoscope className="w-5 h-5 text-teal-700" />
                            <span className="font-bold">{doc.name}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0" />}
                        </button>
                      );
                    })}
                    {slotsByDay && doctors.length === 0 && (
                      <p className="text-sm text-slate-600">
                        No open slots in {selectedDept} this week. Pick another clinic.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{t('stepDateTime', currentLang)}</h3>
                    <p className="text-xs text-slate-500">Only slots that are free right now are shown.</p>
                  </div>

                  {!slotsByDay && !loadError && (
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading open slots…
                    </p>
                  )}

                  {slotsByDay && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-teal-700" />
                          <span>{t('selectDate', currentLang)}</span>
                        </label>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {Object.keys(slotsByDay).map((day) => {
                            const n = countForDay(day);
                            const isSelected = selectedDate === day;
                            return (
                              <button
                                key={day}
                                disabled={n === 0}
                                onClick={() => {
                                  setSelectedDate(day);
                                  setSelectedSlot(null);
                                }}
                                className={`shrink-0 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                                  isSelected
                                    ? 'border-teal-700 bg-teal-800 text-white'
                                    : n === 0
                                    ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <span className="block">{dayLabel(day)}</span>
                                <span className="block font-medium opacity-80">
                                  {n === 0 ? 'Full' : `${n} open`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-teal-700" />
                          <span>{t('selectSlot', currentLang)}</span>
                        </label>
                        {shownSlots.length === 0 ? (
                          <p className="text-sm text-slate-600">
                            No open slots for this choice. Try another day, doctor or clinic.
                          </p>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto">
                            {shownSlots.map((s) => {
                              const isSelected = selectedSlot === s.slot_id;
                              return (
                                <button
                                  key={s.slot_id}
                                  onClick={() => setSelectedSlot(s.slot_id)}
                                  title={s.doctor_name}
                                  className={`h-11 rounded-xl border-2 font-bold text-xs sm:text-sm transition-all flex items-center justify-center ${
                                    isSelected
                                      ? 'border-teal-700 bg-teal-800 text-white shadow-xs'
                                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                                  }`}
                                >
                                  {timeLabel(s.start)}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {selectedSlot !== null && (
                          <p className="text-xs text-teal-900 font-semibold">
                            {deptSlots.find((s) => s.slot_id === selectedSlot)?.doctor_name}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{t('stepPatient', currentLang)}</h3>
                    <p className="text-xs text-slate-500">
                      We use your number only to manage this booking. You can book for a family member.
                    </p>
                  </div>

                  {familyProfiles.length > 0 && (
                    <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-2">
                      <span className="text-xs font-bold text-purple-900 block">Book for a saved family member:</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleFamilyMemberChange('self')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-purple-950 border border-purple-200"
                        >
                          Myself
                        </button>
                        {familyProfiles.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => handleFamilyMemberChange(f.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-purple-950 border border-purple-200"
                          >
                            {f.fullName} ({f.relationship})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">{t('patientNameLabel', currentLang)} *</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold"
                      placeholder="Full name"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">{t('patientPhoneLabel', currentLang)} *</label>
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

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    By booking you agree that the hospital sees your name and number for this visit.
                  </p>
                </div>
              )}

              {errorMsg && step !== 5 && (
                <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {step === 5 && created && (
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {t('bookingSuccessTitle', currentLang)}
                  </h3>

                  <div className="p-5 rounded-2xl bg-slate-50 border-2 border-dashed border-teal-800/40 text-left space-y-4">
                    <div className="border-b border-slate-200 pb-3">
                      <span className="text-xs text-slate-500 font-semibold block">{t('tokenNumber', currentLang)}</span>
                      <span className="text-2xl font-black text-teal-900 tracking-wider font-mono">
                        {created.referenceCode}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div>
                        <span className="text-slate-500 block">Patient:</span>
                        <span className="font-bold text-slate-900">{created.patientName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Hospital:</span>
                        <span className="font-bold text-slate-900 line-clamp-2">{created.hospitalName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Doctor:</span>
                        <span className="font-bold text-slate-900">{created.doctorName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Date and time:</span>
                        <span className="font-bold text-teal-900 font-mono">
                          {created.date} · {created.timeSlot}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-teal-50/80 p-3 rounded-xl border border-teal-200 text-left">
                    {t('bookingNotice', currentLang)}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      onClick={handleAddAppointmentReminder}
                      disabled={reminderAdded}
                      className="w-full sm:flex-1 h-12 rounded-xl border border-teal-700 bg-teal-50 hover:bg-teal-100 disabled:opacity-60 text-teal-950 font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <BellRing className="w-4 h-4 text-teal-700" />
                      <span>{reminderAdded ? 'Reminder added' : t('addToRemindersBtn', currentLang)}</span>
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

            {step < 5 && (
              <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4 | 5)}
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
                    disabled={step === 3 && selectedSlot === null}
                    onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4 | 5)}
                    className="h-12 px-6 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white font-bold text-sm shadow-xs flex items-center gap-2"
                  >
                    <span>Continue</span>
                    <span>→</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleConfirmBooking}
                    className="h-12 px-6 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-60 active:scale-98 text-white font-bold text-base shadow-md flex items-center gap-2"
                  >
                    <span>{busy ? 'Booking…' : t('bookNowBtn', currentLang)}</span>
                    {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-teal-300" />}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
