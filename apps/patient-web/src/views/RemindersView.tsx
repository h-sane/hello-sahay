import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  Trash2,
  Pause,
  Play,
  RotateCcw,
  Calendar,
  X,
  User,
  Heart,
  AlertTriangle,
} from 'lucide-react';
import { Language, Reminder } from '../types';
import { t } from '../translations';
import { storageService } from '../services/storageService';
import { speechService } from '../services/speechService';

interface RemindersViewProps {
  currentLang: Language;
}

export const RemindersView: React.FC<RemindersViewProps> = ({ currentLang }) => {
  const [reminders, setReminders] = useState<Reminder[]>(storageService.getReminders());
  const [showAddModal, setShowAddModal] = useState(false);
  const [playingReminderId, setPlayingReminderId] = useState<string | null>(null);

  // New reminder form fields
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('1 Tablet (1 மாத்திரை)');
  const [instructions, setInstructions] = useState('After Food (உணவுக்குப் பின்)');
  const [frequency, setFrequency] = useState<'daily' | 'twice' | 'thrice'>('daily');
  const [time1, setTime1] = useState('08:30');
  const [time2, setTime2] = useState('20:30');
  const [familyMemberName, setFamilyMemberName] = useState('Muthuvel (Self)');
  const [durationDays, setDurationDays] = useState(30);

  const reloadReminders = () => {
    setReminders(storageService.getReminders());
  };

  const handleToggleStatus = (id: string, currentStatus: 'active' | 'paused') => {
    const next = currentStatus === 'active' ? 'paused' : 'active';
    storageService.updateReminderStatus(id, next);
    reloadReminders();
    speechService.playAudioChime(600, 0.1);
  };

  const handleDelete = (id: string) => {
    storageService.deleteReminder(id);
    reloadReminders();
    speechService.playAudioChime(400, 0.15);
  };

  const handleMarkDose = (id: string, action: 'taken' | 'snoozed' | 'skipped') => {
    storageService.recordDoseAdherence(id, action);
    reloadReminders();
    speechService.playAudioChime(action === 'taken' ? 880 : 540, 0.2);
  };

  const handleSpeakReminder = (reminder: Reminder) => {
    if (playingReminderId === reminder.id) {
      speechService.stop();
      setPlayingReminderId(null);
      return;
    }

    setPlayingReminderId(reminder.id);
    let speechText = '';
    if (currentLang === 'ta') {
      speechText = `மருந்து நினைவூட்டல்: ${reminder.medicineName}. அளவு: ${reminder.dosage}. வழிமுறை: ${reminder.instructions}. குறித்து வைக்கப்பட்டுள்ள நேரம்: ${reminder.times.join(' மற்றும் ')}. தயவுசெய்து தவறாமல் எடுத்துக்கொள்ளவும்.`;
    } else if (currentLang === 'hi') {
      speechText = `दवा रिमाइंडर: ${reminder.medicineName}. खुराक: ${reminder.dosage}. निर्देश: ${reminder.instructions}. समय: ${reminder.times.join(' और ')}. कृपया समय पर दवा लें।`;
    } else {
      speechText = `Medicine Reminder for ${reminder.medicineName}. Dosage: ${reminder.dosage}. Instructions: ${reminder.instructions}. Scheduled time: ${reminder.times.join(', ')}. Please take your dose on time.`;
    }

    speechService.speak(speechText, currentLang, () => {
      setPlayingReminderId(null);
    });
  };

  const handleSaveNewReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;

    const times = frequency === 'twice' ? [time1, time2] : frequency === 'thrice' ? ['08:00', '13:00', '20:30'] : [time1];

    const newReminder: Reminder = {
      id: `rem-${Date.now()}`,
      medicineName: medName.trim(),
      dosage: dosage.trim(),
      instructions: instructions.trim(),
      times,
      frequency,
      durationDays: Number(durationDays) || 30,
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
      lastTakenTimestamp: null,
      adherenceHistory: [],
      familyMemberName: familyMemberName.trim(),
    };

    storageService.saveReminder(newReminder);
    reloadReminders();
    setShowAddModal(false);
    setMedName('');
    speechService.playAudioChime(850, 0.15);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('remindersTitle', currentLang)}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            {t('remindersSubtitle', currentLang)}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="h-12 px-5 rounded-2xl bg-teal-800 hover:bg-teal-900 active:scale-98 text-white font-bold text-sm sm:text-base shadow-md flex items-center justify-center gap-2 transition-all self-start sm:self-auto touch-target focus:ring-2 focus:ring-teal-700"
        >
          <Plus className="w-5 h-5" />
          <span>{t('addReminderBtn', currentLang)}</span>
        </button>
      </div>

      {/* Browser Notification Note */}
      <div className="p-3.5 bg-slate-100 rounded-2xl text-xs text-slate-600 flex items-start gap-2.5">
        <Clock className="w-4 h-4 text-teal-800 shrink-0 mt-0.5" />
        <p>
          {currentLang === 'ta'
            ? 'குறிப்பு: உலாவி திறந்திருக்கும் போது நினைவூட்டல்கள் ஒலிக்கும். ஆஃப்லைனிலும் நினைவூட்டல் அட்டவணையை பார்க்கலாம்.'
            : currentLang === 'hi'
            ? 'नोट: ब्राउज़र खुला रहने पर ऑडियो घंटी बजेगी। ऑफलाइन में भी सभी सहेजी गई दवाएं उपलब्ध हैं।'
            : 'Reminders sound while the browser is active. Saved doses remain accessible completely offline.'}
        </p>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {reminders.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Bell className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">
              {t('noRemindersYet', currentLang)}
            </h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 rounded-xl bg-teal-800 text-white text-sm font-bold shadow-xs"
            >
              {t('addReminderBtn', currentLang)}
            </button>
          </div>
        ) : (
          reminders.map((rem: Reminder) => {
            const isPlaying = playingReminderId === rem.id;
            const isPaused = rem.status === 'paused';

            return (
              <article
                key={rem.id}
                className={`bg-white rounded-3xl border transition-all p-5 sm:p-6 shadow-xs space-y-4 ${
                  isPaused
                    ? 'border-slate-200 opacity-70 bg-slate-50/50'
                    : 'border-slate-200 hover:border-teal-700/60'
                }`}
              >
                {/* Header line: Title, family tag, status button */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {rem.familyMemberName && (
                        <span className="font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <User className="w-3 h-3 text-purple-700" />
                          <span>{rem.familyMemberName}</span>
                        </span>
                      )}
                      <span className="text-slate-500 font-medium">
                        {rem.frequency === 'daily'
                          ? 'Once Daily'
                          : rem.frequency === 'twice'
                          ? 'Twice Daily'
                          : 'Thrice Daily'}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                      {rem.medicineName}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 font-medium">
                      {rem.dosage} ·{' '}
                      <span className="text-teal-900 font-bold">{rem.instructions}</span>
                    </p>
                  </div>

                  {/* Audio Readout & Pause Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleSpeakReminder(rem)}
                      className={`p-2.5 rounded-xl border transition-all touch-target ${
                        isPlaying
                          ? 'bg-teal-800 text-white border-teal-800 ring-2 ring-teal-600 animate-pulse'
                          : 'border-slate-200 hover:border-teal-700 text-teal-800 bg-teal-50/60 hover:bg-teal-100'
                      }`}
                      aria-label="Read out dose reminder"
                      title="Read out dose reminder"
                    >
                      {isPlaying ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={() => handleToggleStatus(rem.id, rem.status as 'active' | 'paused')}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 text-slate-600 transition-colors touch-target"
                      title={isPaused ? 'Resume reminder' : 'Pause reminder'}
                    >
                      {isPaused ? <Play className="w-5 h-5 text-emerald-700" /> : <Pause className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={() => handleDelete(rem.id)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-400 hover:text-red-700 transition-colors touch-target"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Scheduled Times */}
                <div className="flex items-center gap-2 pt-1">
                  <Clock className="w-4 h-4 text-teal-800" />
                  <span className="text-xs font-bold text-slate-700">Scheduled Times:</span>
                  <div className="flex items-center gap-1.5">
                    {rem.times.map((tVal) => (
                      <span
                        key={tVal}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-950 font-mono font-bold text-xs border border-teal-200/80"
                      >
                        {tVal}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Action Buttons: Taken / Snooze / Skip */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMarkDose(rem.id, 'taken')}
                      className="h-11 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs touch-target"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t('markTaken', currentLang)}</span>
                    </button>

                    <button
                      onClick={() => handleMarkDose(rem.id, 'snoozed')}
                      className="h-11 px-3.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-1.5 touch-target"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                      <span>{t('snooze10m', currentLang)}</span>
                    </button>

                    <button
                      onClick={() => handleMarkDose(rem.id, 'skipped')}
                      className="h-11 px-3 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 text-xs font-medium touch-target"
                    >
                      <span>{t('skipDose', currentLang)}</span>
                    </button>
                  </div>

                  {/* Adherence summary */}
                  {rem.adherenceHistory && rem.adherenceHistory.length > 0 && (
                    <span className="text-xs text-slate-500 font-medium">
                      Last taken: {rem.adherenceHistory[0].date} ({rem.adherenceHistory[0].time})
                    </span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* ADD REMINDER MODAL */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-6 bg-teal-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{t('addReminderBtn', currentLang)}</h3>
                <p className="text-xs text-teal-200 mt-0.5">
                  Enter medicine details as written on your prescription or Jan Aushadhi packet.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-teal-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewReminder} className="p-6 overflow-y-auto space-y-4">
              {/* Medicine Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {t('medNameLabel', currentLang)} *
                </label>
                <input
                  type="text"
                  required
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="e.g. Metformin 500mg, Calpol 650"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>

              {/* Dosage & Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {t('dosageLabel', currentLang)}
                  </label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="1 Tablet, 5ml"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {t('instructionsLabel', currentLang)}
                  </label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="After Food, Empty stomach"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Frequency */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {t('frequencyLabel', currentLang)}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFrequency('daily')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold ${
                      frequency === 'daily'
                        ? 'bg-teal-800 text-white border-teal-800'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Once Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency('twice')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold ${
                      frequency === 'twice'
                        ? 'bg-teal-800 text-white border-teal-800'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Twice Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency('thrice')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold ${
                      frequency === 'thrice'
                        ? 'bg-teal-800 text-white border-teal-800'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Three Times
                  </button>
                </div>
              </div>

              {/* Time pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Morning Dose Time
                  </label>
                  <input
                    type="time"
                    value={time1}
                    onChange={(e) => setTime1(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-mono font-bold"
                  />
                </div>

                {frequency === 'twice' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Night Dose Time
                    </label>
                    <input
                      type="time"
                      value={time2}
                      onChange={(e) => setTime2(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Family member label */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Patient / Family Member Name
                </label>
                <input
                  type="text"
                  value={familyMemberName}
                  onChange={(e) => setFamilyMemberName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-11 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-teal-800 text-white font-bold text-sm shadow-md"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
