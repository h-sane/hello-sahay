import React, { useEffect, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { ProfileSheet } from './components/ProfileSheet';
import { NotificationModal } from './components/NotificationModal';
import { BookingDetailsModal } from './components/BookingDetailsModal';
import { DEMO_BOOKINGS, DEMO_HELPER, sathiApi } from './services/api';
import {
  AvailabilityData,
  EarningsData,
  HelperNotification,
  HelperProfile,
  NavTab,
  ServiceBooking,
} from './types';
import { BookingsView } from './views/BookingsView';
import { CalendarView } from './views/CalendarView';
import { EarningsView } from './views/EarningsView';
import { HomeView } from './views/HomeView';
import { ProfileView } from './views/ProfileView';
import { RegistrationView } from './views/RegistrationView';
import { SignInView } from './views/SignInView';

export default function App() {
  const [profile, setProfile] = useState<HelperProfile | null>(() => {
    return sathiApi.getSavedProfile();
  });
  const [isAuth, setIsAuth] = useState<boolean>(() => {
    return !!sathiApi.getToken();
  });
  const [authView, setAuthView] = useState<'signin' | 'register'>('signin');

  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [bookings, setBookings] = useState<ServiceBooking[]>(DEMO_BOOKINGS);
  const [earnings, setEarnings] = useState<EarningsData>({
    today_earnings: 500,
    weekly_earnings: 1100,
    monthly_earnings: 1600,
    total_earnings: 5800,
    pending_earnings: 0,
    completed_count: 19,
    transactions: [],
  });
  const [availability, setAvailability] = useState<AvailabilityData>({
    is_online: true,
    working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    working_hours_start: '08:00',
    working_hours_end: '19:00',
    unavailable_dates: [],
  });
  const [notifications, setNotifications] = useState<HelperNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(1);

  // Modals & Sheets
  const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(null);
  const [showProfileSheet, setShowProfileSheet] = useState<boolean>(false);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [showEditProfile, setShowEditProfile] = useState<boolean>(false);

  // Load fresh data
  const refreshAll = async () => {
    try {
      const [p, b, e, a, n] = await Promise.all([
        sathiApi.getProfile(),
        sathiApi.getBookings('all'),
        sathiApi.getEarnings(),
        sathiApi.getAvailability(),
        sathiApi.getNotifications(),
      ]);
      if (p) setProfile(p);
      if (b) setBookings(b);
      if (e) setEarnings(e);
      if (a) setAvailability(a);
      if (n) {
        setNotifications(n.notifications);
        setUnreadCount(n.unread_count);
      }
    } catch {
      // Keep existing demo state
    }
  };

  useEffect(() => {
    refreshAll();
  }, [isAuth]);

  // Auth Handlers
  const handleSignedIn = (helper: HelperProfile) => {
    setProfile(helper);
    setIsAuth(true);
    refreshAll();
  };

  const handleRegistered = (helper: HelperProfile) => {
    setProfile(helper);
    setIsAuth(true);
    refreshAll();
  };

  const handleLogout = () => {
    sathiApi.logout();
    setIsAuth(false);
    setAuthView('signin');
  };

  // Actions
  const handleToggleOnline = async (online: boolean) => {
    if (!profile) return;
    const updated = { ...profile, is_online: online };
    setProfile(updated);
    await sathiApi.updateAvailability({ is_online: online });
  };

  const handleBookingAction = async (
    id: number,
    action: 'accept' | 'reject' | 'start' | 'complete',
    notes?: string
  ) => {
    const updated = await sathiApi.executeBookingAction(id, action, notes);
    setBookings((prev) => {
      const remaining = prev.filter((b) => b.id !== id);
      return [updated, ...remaining];
    });
    if (selectedBooking && selectedBooking.id === id) {
      setSelectedBooking(updated);
    }
    // Refresh earnings and notifications
    const [e, n] = await Promise.all([sathiApi.getEarnings(), sathiApi.getNotifications()]);
    setEarnings(e);
    setNotifications(n.notifications);
    setUnreadCount(n.unread_count);
  };

  const handleUpdateProfile = async (data: Partial<HelperProfile>) => {
    const updated = await sathiApi.updateProfile(data);
    setProfile(updated);
  };

  const handleUpdateAvailability = async (data: Partial<AvailabilityData>) => {
    const updated = await sathiApi.updateAvailability(data);
    setAvailability((prev) => ({ ...prev, ...updated }));
  };

  const handleMarkNotificationRead = async (id: number) => {
    await sathiApi.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  // If not authenticated
  if (!isAuth) {
    if (authView === 'register') {
      return (
        <RegistrationView
          onRegistered={handleRegistered}
          onBackToSignIn={() => setAuthView('signin')}
        />
      );
    }
    return (
      <SignInView
        onSignedIn={handleSignedIn}
        onNavigateToRegister={() => setAuthView('register')}
      />
    );
  }

  const helper = profile || DEMO_HELPER;
  const newRequestsCount = bookings.filter((b) => b.status === 'new_request').length;

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-between text-slate-900 pb-20">
      {/* Fixed Sticky Header */}
      <Header
        profile={helper}
        unreadCount={unreadCount}
        onOpenNotifications={() => setShowNotificationModal(true)}
        onOpenProfileSheet={() => setShowProfileSheet(true)}
      />

      {/* Main Content Area by Tab */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomeView
            profile={helper}
            bookings={bookings}
            earnings={earnings}
            onToggleOnline={handleToggleOnline}
            onNavigate={(t) => setCurrentTab(t)}
            onOpenBooking={(b) => setSelectedBooking(b)}
            onAction={handleBookingAction}
          />
        )}

        {currentTab === 'bookings' && (
          <BookingsView
            bookings={bookings}
            onOpenBooking={(b) => setSelectedBooking(b)}
            onAction={handleBookingAction}
          />
        )}

        {currentTab === 'earnings' && <EarningsView earnings={earnings} />}

        {currentTab === 'calendar' && (
          <CalendarView
            bookings={bookings}
            availability={availability}
            onUpdateAvailability={handleUpdateAvailability}
            onOpenBooking={(b) => setSelectedBooking(b)}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            profile={helper}
            isEditing={showEditProfile}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
            onCloseEdit={() => setShowEditProfile(false)}
          />
        )}
      </main>

      {/* Fixed 5-Item Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setShowEditProfile(false);
        }}
        newRequestsCount={newRequestsCount}
      />

      {/* Profile Drawer Sheet */}
      <ProfileSheet
        profile={helper}
        isOpen={showProfileSheet}
        onClose={() => setShowProfileSheet(false)}
        onNavigate={(tab) => {
          setCurrentTab(tab);
          setShowProfileSheet(false);
        }}
        onLogout={handleLogout}
        onOpenEditProfile={() => {
          setCurrentTab('profile');
          setShowEditProfile(true);
          setShowProfileSheet(false);
        }}
      />

      {/* Notifications Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
      />

      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={selectedBooking !== null}
        onClose={() => setSelectedBooking(null)}
        onAction={handleBookingAction}
      />
    </div>
  );
}

