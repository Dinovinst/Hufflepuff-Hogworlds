import React, { useState, useEffect } from 'react';
import { 
  AppView, 
  StudentProfile, 
  UserStatus,
  ClassScheduleItem,
  HouseAnnouncement,
  HouseRole
} from './types';
import { 
  ALL_SPELLS_DATA, 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_EVENTS, 
  INITIAL_MEMBERS, 
  INITIAL_SCHEDULE, 
  INITIAL_STUDENT_PROFILE,
} from './data/hufflepuffData';

import { LandingView } from './components/LandingView';
import { RegistrationView, DiscordAuthUser } from './components/RegistrationView';
import { HouseNavbar } from './components/HouseNavbar';
import { HouseDashboardView } from './components/HouseDashboardView';
import { EducationCenterView } from './components/EducationCenterView';
import { MembersDirectoryTab } from './components/MembersDirectoryTab';
import { 
  subscribeToMembers, 
  subscribeToAnnouncements, 
  subscribeToSchedules, 
  getUserProfileFromFirestore, 
  saveUserProfileToFirestore, 
  saveAnnouncementToFirestore, 
  deleteAnnouncementFromFirestore, 
  saveScheduleToFirestore, 
  deleteScheduleFromFirestore 
} from './lib/hufflepuffFirestore';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [userStatus, setUserStatus] = useState<UserStatus>('guest');
  const [userProfile, setUserProfile] = useState<StudentProfile>(INITIAL_STUDENT_PROFILE);
  const [activeDiscordUser, setActiveDiscordUser] = useState<DiscordAuthUser | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // App state
  const [announcements, setAnnouncements] = useState<HouseAnnouncement[]>(INITIAL_ANNOUNCEMENTS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [scheduleData, setScheduleData] = useState<ClassScheduleItem[]>(INITIAL_SCHEDULE);
  const [spellsData] = useState(ALL_SPELLS_DATA);
  const [membersData, setMembersData] = useState(INITIAL_MEMBERS);

  // Real-time subscriptions to Firebase Firestore (Hufflepuff Hogworlds database)
  useEffect(() => {
    // 1. Subscribe to registered members in Firestore
    const unsubMembers = subscribeToMembers((updatedMembers) => {
      setMembersData(updatedMembers);
    });

    // 2. Subscribe to announcements in Firestore
    const unsubAnnouncements = subscribeToAnnouncements((updatedAnnouncements) => {
      setAnnouncements(updatedAnnouncements);
    });

    // 3. Subscribe to schedules in Firestore
    const unsubSchedules = subscribeToSchedules((updatedSchedules) => {
      setScheduleData(updatedSchedules);
    });

    // 4. Restore saved login session from Firebase Firestore
    const savedDiscordId = localStorage.getItem('hufflepuff_user_id');
    if (savedDiscordId) {
      getUserProfileFromFirestore(savedDiscordId)
        .then((profile) => {
          if (profile) {
            setUserProfile(profile);
            setUserStatus('approved');
            setCurrentView('dashboard');
          } else {
            // Check fallback server database
            fetch(`/api/users/${savedDiscordId}`)
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => {
                if (data?.user) {
                  setUserProfile(data.user);
                  setUserStatus('approved');
                  setCurrentView('dashboard');
                }
              })
              .catch(() => {
                localStorage.removeItem('hufflepuff_user_id');
              });
          }
        })
        .catch(() => {
          localStorage.removeItem('hufflepuff_user_id');
        });
    }

    return () => {
      unsubMembers();
      unsubAnnouncements();
      unsubSchedules();
    };
  }, []);

  // Handlers for Firestore Announcement updates
  const handleUpdateAnnouncements = (newList: HouseAnnouncement[]) => {
    setAnnouncements(newList);
    const currentIds = new Set(newList.map((a) => a.id));
    for (const prev of announcements) {
      if (!currentIds.has(prev.id)) {
        deleteAnnouncementFromFirestore(prev.id).catch((err) =>
          console.warn('Delete announcement firestore warning:', err)
        );
      }
    }
    for (const item of newList) {
      saveAnnouncementToFirestore(item).catch((err) =>
        console.warn('Save announcement firestore warning:', err)
      );
    }
  };

  // Handlers for Firestore Schedule updates
  const handleUpdateSchedule = (newList: ClassScheduleItem[]) => {
    setScheduleData(newList);
    const currentIds = new Set(newList.map((s) => s.id));
    for (const prev of scheduleData) {
      if (!currentIds.has(prev.id)) {
        deleteScheduleFromFirestore(prev.id).catch((err) =>
          console.warn('Delete schedule firestore warning:', err)
        );
      }
    }
    for (const item of newList) {
      saveScheduleToFirestore(item).catch((err) =>
        console.warn('Save schedule firestore warning:', err)
      );
    }
  };

  // Handlers
  const handleDiscordLoginSuccess = (profile: StudentProfile) => {
    setUserProfile(profile);
    setUserStatus('approved');
    if (profile.discordId) {
      localStorage.setItem('hufflepuff_user_id', profile.discordId);
    }
    setCurrentView('dashboard');
  };

  const handleNeedRegistration = (discordUser: DiscordAuthUser) => {
    setActiveDiscordUser(discordUser);
    setIsEditingProfile(false);
    setCurrentView('register');
  };

  const handleToggleAdminRole = () => {
    setUserProfile((prev) => {
      const isCurrentlyAdmin =
        prev.houseRole === 'แอดมิน' || (prev.houseRoles && prev.houseRoles.includes('แอดมิน'));
      let updatedRoles: HouseRole[];
      let updatedPrimaryRole: HouseRole;

      if (isCurrentlyAdmin) {
        const remaining = (prev.houseRoles || []).filter((r) => r !== 'แอดมิน');
        updatedRoles = remaining.length > 0 ? remaining : (['นักเรียนทั่วไป'] as HouseRole[]);
        updatedPrimaryRole = updatedRoles[0];
      } else {
        const existing = prev.houseRoles || [prev.houseRole];
        updatedRoles = ['แอดมิน', ...existing.filter((r) => r !== 'แอดมิน')];
        updatedPrimaryRole = 'แอดมิน';
      }

      const updated: StudentProfile = {
        ...prev,
        houseRole: updatedPrimaryRole,
        houseRoles: updatedRoles,
      };

      // Persist to Firebase Firestore
      if (updated.discordId) {
        saveUserProfileToFirestore(updated).catch((err) =>
          console.warn('Failed to sync role to Firestore:', err)
        );
        fetch(`/api/users/${prev.discordId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            houseRole: updatedPrimaryRole,
            houseRoles: updatedRoles,
          }),
        }).catch((err) => console.error('Failed to sync role to server:', err));
      }

      return updated;
    });
  };

  const handleRegistrationSuccess = (newProfile: StudentProfile) => {
    setUserProfile(newProfile);
    setUserStatus('approved');
    if (newProfile.discordId) {
      localStorage.setItem('hufflepuff_user_id', newProfile.discordId);
      saveUserProfileToFirestore(newProfile).catch((err) =>
        console.warn('Failed to save user profile to Firestore:', err)
      );
    }
    setCurrentView('dashboard');
  };

  const handleTogglePossessedSpell = (spellId: string) => {
    setUserProfile((prev) => {
      const current = prev.possessedSpells || [];
      const updated = current.includes(spellId)
        ? current.filter((id) => id !== spellId)
        : [...current, spellId];

      const updatedProfile: StudentProfile = {
        ...prev,
        possessedSpells: updated,
      };

      // Sync with members data
      setMembersData((prevMembers) =>
        prevMembers.map((m) =>
          m.studentId === prev.studentId || m.name === prev.name
            ? { ...m, possessedSpells: updated }
            : m
        )
      );

      // Persist to Firebase Firestore
      if (updatedProfile.discordId) {
        saveUserProfileToFirestore(updatedProfile).catch((err) =>
          console.warn('Failed to update possessed spells on Firestore:', err)
        );
        fetch(`/api/users/${prev.discordId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ possessedSpells: updated }),
        }).catch((err) => console.error('Failed to update possessed spells on server:', err));
      }

      return updatedProfile;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('hufflepuff_user_id');
    setActiveDiscordUser(null);
    setUserStatus('guest');
    setCurrentView('landing');
  };

  // If on Landing page
  if (currentView === 'landing') {
    return (
      <LandingView
        onLoginSuccess={handleDiscordLoginSuccess}
        onNeedRegistration={handleNeedRegistration}
      />
    );
  }

  // If on Registration or Edit Profile page
  if (currentView === 'register') {
    return (
      <RegistrationView
        onBack={() => setCurrentView(isEditingProfile ? 'dashboard' : 'landing')}
        onSubmitSuccess={handleRegistrationSuccess}
        discordUser={activeDiscordUser}
        existingProfile={isEditingProfile ? userProfile : null}
      />
    );
  }

  // Common authenticated layout (Dashboard & Internal management tabs)
  return (
    <div className="min-h-screen bg-[#0e0e12] text-amber-50 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navbar */}
      <HouseNavbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        userProfile={userProfile}
        onLogout={handleLogout}
        onEditProfile={() => {
          setIsEditingProfile(true);
          setCurrentView('register');
        }}
        onToggleAdmin={handleToggleAdminRole}
      />

      {/* Main View Switcher */}
      <main className="flex-1">
        {currentView === 'dashboard' && (
          <HouseDashboardView
            userProfile={userProfile}
            announcements={announcements}
            events={events}
            onNavigate={(view) => setCurrentView(view)}
            onUpdateAnnouncements={handleUpdateAnnouncements}
            onUpdateEvents={setEvents}
          />
        )}

        {(currentView === 'schedule' || currentView === 'spells') && (
          <EducationCenterView
            initialTab={currentView}
            scheduleData={scheduleData}
            onUpdateSchedule={handleUpdateSchedule}
            spellsData={spellsData}
            userProfile={userProfile}
            members={membersData}
            onTogglePossessedSpell={handleTogglePossessedSpell}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'members' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <MembersDirectoryTab members={membersData} />
          </div>
        )}
      </main>

      {/* House Footer */}
      <footer className="border-t border-[#FEE101]/10 bg-[#09090c] py-6 px-4 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © Hogwarts School of Witchcraft and Wizardry • Hogworlds Wizardry Project Hufflepuff House
          </p>
          <div className="flex items-center gap-4 text-neutral-400 flex-wrap justify-center">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-[#FEE101]/20 text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Firebase: Hufflepuff Hogworlds
            </span>
            <span>Helga Hufflepuff • Dedication, Patience & Loyalty</span>
            <span className="text-[#FEE101]">🟡⚫</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
