import React, { useState, useEffect } from 'react';
import { Language, UserSettings, Hospital, Appointment, UserCoordinates } from './types';
import { storageService } from './services/storageService';
import { locationService } from './services/locationService';
import { hospitalService } from './services/hospitalService';
import { appointmentService } from './services/appointmentService';
import { api } from './services/api';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { LocationSelectorModal } from './components/LocationSelectorModal';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { HomeView } from './views/HomeView';
import { HospitalsView } from './views/HospitalsView';
import { BookingModal } from './views/BookingModal';
import { AskSahayView } from './views/AskSahayView';
import { VoiceCallView } from './views/VoiceCallView';
import { MedicinesView } from './views/MedicinesView';
import { MyHealthView } from './views/MyHealthView';
import { EmergencyView } from './views/EmergencyView';
import { AppDataProvider } from './components/AppData';
import { AlertBanner } from './components/AlertBanner';
import { LocationSharingSheet } from './components/LocationSharing';
import { backgroundLocation } from './services/backgroundLocation';
import { BigButton, pick } from './components/ui';

export default function App() {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = storageService.getSettings();
    // Tamil, Hindi, Kannada, Malayalam and English are supported; older saved settings may hold another language.
    return ['ta', 'hi', 'kn', 'ml', 'te', 'en'].includes(saved.language) ? saved : { ...saved, language: 'en' as Language };
  });
  const [hospitalError, setHospitalError] = useState('');
  const [, setHospitalsVersion] = useState(0);
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // User location state (persisted or auto-detected)
  // null until the phone's GPS or the user's own choice gives a place; never a guessed default
  const [userCoordinates, setUserCoordinates] = useState<UserCoordinates | null>(() => locationService.getSavedLocation());

  const [nearestHospital, setNearestHospital] = useState<Hospital | null>(null);

  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(!settings.hasConsented);
  // Show location popup before entering app if no saved location (after language consent)
  const [showLocationModal, setShowLocationModal] = useState<boolean>(() => {
    return settings.hasConsented && !locationService.getSavedLocation();
  });
  const [selectedHospitalForBooking, setSelectedHospitalForBooking] = useState<Hospital | null>(null);
  const [showVoiceCallModal, setShowVoiceCallModal] = useState<boolean>(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [askLocationSharing, setAskLocationSharing] = useState<boolean>(false);

  useEffect(() => { window.scrollTo(0, 0); }, [currentTab]);

  // Load facilities from the API, nearest first, whenever the location changes
  useEffect(() => {
    if (!userCoordinates) return;
    let cancelled = false;
    hospitalService.load(userCoordinates).then(() => {
      if (cancelled) return;
      setHospitalError(hospitalService.getError());
      setHospitalsVersion((v) => v + 1);
    });
    hospitalService.nearestReal(userCoordinates).then((h) => {
      if (!cancelled) setNearestHospital(h);
    });
    return () => {
      cancelled = true;
    };
  }, [userCoordinates?.latitude, userCoordinates?.longitude]);

  // Refresh this patient's appointments from the server once their number is verified
  useEffect(() => {
    if (settings.userPhone) appointmentService.refresh(settings.userPhone).catch(() => {});
  }, [settings.userPhone]);

  // Keep the helpline's view of this patient's location fresh while the app is open
  useEffect(() => {
    if (!settings.userPhone || !settings.locationPermission || !userCoordinates) return;
    const push = () => api.pushLocation(settings.userPhone!, userCoordinates).catch(() => {});
    push();
    const timer = setInterval(push, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [settings.userPhone, settings.locationPermission, userCoordinates?.latitude, userCoordinates?.longitude]);

  // Re-read the GPS on every launch so a patient who has moved is not left on yesterday's place;
  // a place they picked by hand stays until they change it.
  useEffect(() => {
    if (!locationService.getSavedLocation()?.manual) {
      locationService.detectUserLocation().then(setUserCoordinates).catch(() => {});
    }
  }, []);

  // Android: keep the background location worker signed in on every launch, and ask once, after sign-up, whether to start it
  useEffect(() => {
    if (!backgroundLocation.supported || !settings.userPhone || !settings.phoneVerified || !settings.profileComplete) return;
    if (backgroundLocation.neverAsked()) setAskLocationSharing(true);
    else backgroundLocation.resume(settings.userPhone);
  }, [settings.userPhone, settings.phoneVerified, settings.profileComplete]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleUpdateSettings = (updated: Partial<UserSettings>) => {
    const newSettings = storageService.saveSettings(updated);
    setSettings(newSettings);
  };

  // Mobile number, code and profile details are required before anything else is shown.
  const needsProfile = settings.hasConsented && !(settings.phoneVerified && settings.profileComplete);

  const handleSaveLanguageAndConsent = (data: {
    language: Language;
    locationPermission: boolean;
    microphonePermission: boolean;
  }) => {
    const updated = storageService.saveSettings({
      language: data.language,
      locationPermission: data.locationPermission,
      microphonePermission: data.microphonePermission,
      hasConsented: true,
    });
    setSettings(updated);
    setShowLanguageModal(false);

    // After language selection, open Location Popup if user hasn't set location
    if (!locationService.getSavedLocation()) {
      setShowLocationModal(true);
    }
  };

  const handleSelectLocation = (coords: UserCoordinates) => {
    locationService.saveLocation(coords);
    setUserCoordinates(coords);
    setShowLocationModal(false);
  };

  const handleLanguageQASwitch = (lang: Language) => {
    const updated = storageService.saveSettings({ language: lang });
    setSettings(updated);
  };

  return (
    <AppDataProvider signedIn={!!(settings.phoneVerified && settings.profileComplete)} phone={settings.userPhone}>
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Main Top Header */}
      <Header
        currentLang={settings.language}
        locationLabel={userCoordinates?.districtDetected?.split(',')[0]}
        onOpenLocationModal={() => setShowLocationModal(true)}
        onOpenLanguageModal={() => setShowLanguageModal(true)}
        onOpenEmergency={() => setShowEmergencyModal(true)}
        isOnline={isOnline}
        onNavigateHome={() => setCurrentTab('home')}
      />

      <AlertBanner lang={settings.language} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto px-5 pt-6 pb-32">
        {hospitalError && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
            {hospitalError} In an emergency, call 108.
          </div>
        )}
        {!userCoordinates && ['home', 'hospitals', 'ask-sahay'].includes(currentTab) && (
          <div className="rounded-2xl border-2 border-slate-400 bg-white p-5 space-y-4">
            <p className="text-xl font-bold text-slate-900">
              {pick(settings.language, {
                en: 'Tell us where you are to see hospitals near you.',
                hi: 'अपने पास के अस्पताल देखने के लिए बताइए कि आप कहाँ हैं।',
                ta: 'அருகிலுள்ள மருத்துவமனைகளைப் பார்க்க நீங்கள் எங்கே இருக்கிறீர்கள் என்று சொல்லுங்கள்.',
                kn: 'ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳನ್ನು ನೋಡಲು ನೀವು ಎಲ್ಲಿದ್ದೀರಿ ಎಂದು ತಿಳಿಸಿ.',
                ml: 'അടുത്തുള്ള ആശുപത്രികൾ കാണാൻ നിങ്ങൾ എവിടെയാണെന്ന് പറയൂ.',
                te: 'దగ్గరలోని ఆసుపత్రులను చూడటానికి మీరు ఎక్కడ ఉన్నారో చెప్పండి.',
              })}
            </p>
            <BigButton onClick={() => setShowLocationModal(true)}>
              {pick(settings.language, { en: 'Set my location', hi: 'मेरी लोकेशन चुनें', ta: 'என் இருப்பிடத்தை அமை', kn: 'ನನ್ನ ಸ್ಥಳ ಹೊಂದಿಸಿ', ml: 'എന്റെ സ്ഥലം സജ്ജമാക്കുക', te: 'నా స్థానాన్ని సెట్ చేయండి' })}
            </BigButton>
          </div>
        )}
        {currentTab === 'home' && (
          <HomeView
            currentLang={settings.language}
            userSettings={settings}
            userCoordinates={userCoordinates ?? undefined}
            nearestHospital={nearestHospital}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenEmergency={() => setShowEmergencyModal(true)}
            onSelectHospitalForBooking={(hospital) => setSelectedHospitalForBooking(hospital)}
            onOpenLocationSelector={() => setShowLocationModal(true)}
            onOpenVoiceCall={() => setShowVoiceCallModal(true)}
          />
        )}

        {userCoordinates && currentTab === 'hospitals' && (
          <HospitalsView
            currentLang={settings.language}
            userCoordinates={userCoordinates}
            onSelectHospitalForBooking={(hospital) => setSelectedHospitalForBooking(hospital)}
          />
        )}

        {userCoordinates && currentTab === 'ask-sahay' && (
          <AskSahayView
            currentLang={settings.language}
            userCoordinates={userCoordinates}
            onOpenVoiceMode={() => setShowVoiceCallModal(true)}
            onOpenEmergency={() => setShowEmergencyModal(true)}
            onSelectHospitalForBooking={(hospital) => setSelectedHospitalForBooking(hospital)}
            onOpenLocationSelector={() => setShowLocationModal(true)}
          />
        )}

        {currentTab === 'medicines' && (
          <MedicinesView currentLang={settings.language} userCoordinates={userCoordinates} onOpenLocationSelector={() => setShowLocationModal(true)} />
        )}

        {currentTab === 'my-health' && (
          <MyHealthView
            currentLang={settings.language}
            userSettings={settings}
            onUpdateSettings={handleUpdateSettings}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenLocationSelector={() => setShowLocationModal(true)}
          />
        )}
      </main>

      {/* Persistent 5-Tab Thumb Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        currentLang={settings.language}
      />

      {/* Language Selection Modal (9 Major Indian Languages) */}
      <LanguageSelectorModal
        isOpen={showLanguageModal}
        isFirstTime={!settings.hasConsented}
        currentSettings={settings}
        onSave={handleSaveLanguageAndConsent}
        onClose={() => {
          setShowLanguageModal(false);
          if (!locationService.getSavedLocation()) {
            setShowLocationModal(true);
          }
        }}
      />

      {/* First open: mobile number, 6-digit code, patient details */}
      {needsProfile && !showLanguageModal && (
        <ProfileSetupModal
          currentLang={settings.language}
          settings={settings}
          onDone={(update) => {
            handleUpdateSettings(update);
            if (update.profileComplete && !locationService.getSavedLocation()) setShowLocationModal(true);
          }}
        />
      )}

      {/* Location Detection & Selection Popup Before Entering Main App */}
      <LocationSelectorModal
        isOpen={showLocationModal && !showLanguageModal && !needsProfile}
        isInitialPopup={!locationService.getSavedLocation()}
        currentCoords={userCoordinates ?? undefined}
        currentLang={settings.language}
        onSelectLocation={handleSelectLocation}
        onClose={() => setShowLocationModal(false)}
      />

      {askLocationSharing && settings.userPhone && !showLanguageModal && !needsProfile && !showLocationModal && (
        <LocationSharingSheet lang={settings.language} phone={settings.userPhone} onClose={() => setAskLocationSharing(false)} />
      )}

      {/* Smart Appointment Booking Modal */}
      {selectedHospitalForBooking && (
        <BookingModal
          hospital={selectedHospitalForBooking}
          currentLang={settings.language}
          isOnline={isOnline}
          onClose={() => setSelectedHospitalForBooking(null)}
          onBookingComplete={() => window.dispatchEvent(new Event('sahay:appointments'))}
        />
      )}

      {/* Dedicated Voice Call Modal */}
      {showVoiceCallModal && (
        <VoiceCallView
          currentLang={settings.language}
          onClose={() => setShowVoiceCallModal(false)}
          onOpenEmergency={() => {
            setShowVoiceCallModal(false);
            setShowEmergencyModal(true);
          }}
        />
      )}

      {/* Emergency Assistance Modal */}
      {showEmergencyModal && (
        <EmergencyView
          currentLang={settings.language}
          userCoordinates={userCoordinates ?? undefined}
          onClose={() => setShowEmergencyModal(false)}
        />
      )}
    </div>
    </AppDataProvider>
  );
}
