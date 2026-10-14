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

export default function App() {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = storageService.getSettings();
    // Only Tamil, Hindi and English are supported; older saved settings may hold another language.
    return ['ta', 'hi', 'en'].includes(saved.language) ? saved : { ...saved, language: 'en' as Language };
  });
  const [hospitalError, setHospitalError] = useState('');
  const [, setHospitalsVersion] = useState(0);
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // User location state (persisted or auto-detected)
  const [userCoordinates, setUserCoordinates] = useState<UserCoordinates>(() => {
    const saved = locationService.getSavedLocation();
    if (saved) return saved;
    return {
      latitude: 12.5113,
      longitude: 79.8837,
      districtDetected: 'Chengalpattu Rural, Tamil Nadu',
      isLocating: false,
    };
  });

  const [nearestHospital, setNearestHospital] = useState<Hospital | null>(null);

  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(!settings.hasConsented);
  // Show location popup before entering app if no saved location (after language consent)
  const [showLocationModal, setShowLocationModal] = useState<boolean>(() => {
    return settings.hasConsented && !locationService.getSavedLocation();
  });
  const [selectedHospitalForBooking, setSelectedHospitalForBooking] = useState<Hospital | null>(null);
  const [showVoiceCallModal, setShowVoiceCallModal] = useState<boolean>(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);

  // Load facilities from the API, nearest first, whenever the location changes
  useEffect(() => {
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
  }, [userCoordinates.latitude, userCoordinates.longitude]);

  // Refresh this patient's appointments from the server once their number is verified
  useEffect(() => {
    if (settings.userPhone) appointmentService.refresh(settings.userPhone).catch(() => {});
  }, [settings.userPhone]);

  // Keep the helpline's view of this patient's location fresh while the app is open
  useEffect(() => {
    if (!settings.userPhone || !settings.locationPermission) return;
    const push = () => api.pushLocation(settings.userPhone!, userCoordinates).catch(() => {});
    push();
    const timer = setInterval(push, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [settings.userPhone, settings.locationPermission, userCoordinates.latitude, userCoordinates.longitude]);

  // Attempt live GPS detection on startup if the user has not yet saved a location
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator && !locationService.getSavedLocation()) {
      locationService.detectUserLocation().then(setUserCoordinates).catch(() => {});
    }
  }, []);

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
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Main Top Header */}
      <Header
        currentLang={settings.language}
        locationLabel={userCoordinates.districtDetected?.split(',')[0]}
        onOpenLocationModal={() => setShowLocationModal(true)}
        onOpenLanguageModal={() => setShowLanguageModal(true)}
        onOpenEmergency={() => setShowEmergencyModal(true)}
        isOnline={isOnline}
        onNavigateHome={() => setCurrentTab('home')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 pb-24">
        {hospitalError && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
            {hospitalError} Hospital list may be out of date. In an emergency, call 108.
          </div>
        )}
        {currentTab === 'home' && (
          <HomeView
            currentLang={settings.language}
            userSettings={settings}
            userCoordinates={userCoordinates}
            nearestHospital={nearestHospital}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenEmergency={() => setShowEmergencyModal(true)}
            onSelectHospitalForBooking={(hospital) => setSelectedHospitalForBooking(hospital)}
            onOpenLocationSelector={() => setShowLocationModal(true)}
            onOpenVoiceCall={() => setShowVoiceCallModal(true)}
          />
        )}

        {currentTab === 'hospitals' && (
          <HospitalsView
            currentLang={settings.language}
            userCoordinates={userCoordinates}
            onSelectHospitalForBooking={(hospital) => setSelectedHospitalForBooking(hospital)}
          />
        )}

        {currentTab === 'ask-sahay' && (
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
          <MedicinesView currentLang={settings.language} />
        )}

        {currentTab === 'my-health' && (
          <MyHealthView
            currentLang={settings.language}
            userSettings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenBookingForFamily={(name) => {
              setCurrentTab('hospitals');
            }}
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
        currentCoords={userCoordinates}
        currentLang={settings.language}
        onSelectLocation={handleSelectLocation}
        onClose={() => setShowLocationModal(false)}
      />

      {/* Smart Appointment Booking Modal */}
      {selectedHospitalForBooking && (
        <BookingModal
          hospital={selectedHospitalForBooking}
          currentLang={settings.language}
          isOnline={isOnline}
          onClose={() => setSelectedHospitalForBooking(null)}
          onBookingComplete={() => {}}
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
          onClose={() => setShowEmergencyModal(false)}
        />
      )}
    </div>
  );
}
