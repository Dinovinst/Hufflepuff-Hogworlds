import React, { useState } from 'react';
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
  INITIAL_STUDENT_USER_PROFILE
} from './data/hufflepuffData';

import { LandingView } from './components/LandingView';
import { RegistrationView } from './components/RegistrationView';
import { HouseNavbar } from './components/HouseNavbar';
import { HouseDashboardView } from './components/HouseDashboardView';
import { EducationCenterView } from './components/EducationCenterView';
import { MembersDirectoryTab } from './components/MembersDirectoryTab';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [userStatus, setUserStatus] = useState<UserStatus>('guest');
  const [userProfile, setUserProfile] = useState<StudentProfile>(INITIAL_STUDENT_PROFILE);

  // App state
  const [announcements, setAnnouncements] = useState<HouseAnnouncement[]>(INITIAL_ANNOUNCEMENTS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [scheduleData, setScheduleData] = useState<ClassScheduleItem[]>(INITIAL_SCHEDULE);
  const [spellsData] = useState(ALL_SPELLS_DATA);
  const [membersData, setMembersData] = useState(INITIAL_MEMBERS);

  // Handlers
  const handleLoginDiscord = () => {
    setCurrentView('register');
  };

  const handleExploreDemo = () => {
    setUserStatus('approved');
    setUserProfile(INITIAL_STUDENT_USER_PROFILE);
    setCurrentView('dashboard');
  };

  const handleExploreAdminDemo = () => {
    setUserStatus('approved');
    setUserProfile(INITIAL_STUDENT_PROFILE);
    setCurrentView('dashboard');
  };

  const handleToggleAdminRole = () => {
    setUserProfile((prev) => {
      const isCurrentlyAdmin = prev.houseRole === 'แอดมิน' || (prev.houseRoles && prev.houseRoles.includes('แอดมิน'));
      if (isCurrentlyAdmin) {
        const remaining = (prev.houseRoles || []).filter((r) => r !== 'แอดมิน');
        const fallback = remaining.length > 0 ? remaining : (['นักเรียนทั่วไป'] as HouseRole[]);
        return {
          ...prev,
          houseRole: fallback[0],
          houseRoles: fallback,
        };
      } else {
        const existing = prev.houseRoles || [prev.houseRole];
        return {
          ...prev,
          houseRole: 'แอดมิน',
          houseRoles: ['แอดมิน', ...existing.filter((r) => r !== 'แอดมิน')],
        };
      }
    });
  };

  const handleRegistrationSuccess = (newProfile: StudentProfile) => {
    setUserProfile(newProfile);
    setUserStatus('approved');
    // Add to members directory as well
    setMembersData((prev) => [
      {
        id: `mem-${Date.now()}`,
        name: newProfile.name,
        studentId: newProfile.studentId,
        year: newProfile.year,
        role: newProfile.houseRole,
        roles: newProfile.houseRoles || [newProfile.houseRole],
        avatar: newProfile.characterPhoto,
        status: 'online',
        specialty: newProfile.bio || 'สมาชิกใหม่บ้านฮัฟเฟิลพัฟ Hogworlds Wizardry Project',
        possessedSpells: newProfile.possessedSpells || [],
      },
      ...prev,
    ]);
    setCurrentView('dashboard');
  };

  const handleTogglePossessedSpell = (spellId: string) => {
    setUserProfile((prev) => {
      const current = prev.possessedSpells || [];
      const updated = current.includes(spellId)
        ? current.filter((id) => id !== spellId)
        : [...current, spellId];

      // Sync with members data
      setMembersData((prevMembers) =>
        prevMembers.map((m) =>
          m.studentId === prev.studentId || m.name === prev.name
            ? { ...m, possessedSpells: updated }
            : m
        )
      );

      return {
        ...prev,
        possessedSpells: updated,
      };
    });
  };

  const handleLogout = () => {
    setUserStatus('guest');
    setCurrentView('landing');
  };

  // If on Landing page
  if (currentView === 'landing') {
    return (
      <LandingView
        onLoginDiscord={handleLoginDiscord}
      />
    );
  }

  // If on Registration page
  if (currentView === 'register') {
    return (
      <RegistrationView
        onBack={() => setCurrentView('landing')}
        onSubmitSuccess={handleRegistrationSuccess}
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
        onEditProfile={() => setCurrentView('register')}
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
            onUpdateAnnouncements={setAnnouncements}
            onUpdateEvents={setEvents}
          />
        )}

        {(currentView === 'schedule' || currentView === 'spells') && (
          <EducationCenterView
            initialTab={currentView}
            scheduleData={scheduleData}
            onUpdateSchedule={setScheduleData}
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
          <div className="flex items-center gap-4 text-neutral-400">
            <span>Helga Hufflepuff • Dedication, Patience & Loyalty</span>
            <span className="text-[#FEE101]">🟡⚫</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
