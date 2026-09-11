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
import { OwnerAuthModal } from './components/OwnerAuthModal';
import { isOwner } from './utils/permissions';
import { 
  subscribeToMembers, 
  subscribeToAnnouncements, 
  subscribeToSchedules, 
  getUserProfileFromFirestore, 
  saveUserProfileToFirestore, 
  updateMemberRolesInFirestore,
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
  const [showOwnerAuthModal, setShowOwnerAuthModal] = useState(false);

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
              .then(async (res) => {
                if (!res.ok) return null;
                const text = await res.text();
                return text ? JSON.parse(text) : null;
              })
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

    // 5. Handle Discord OAuth redirect callback (?code=... or #access_token=...)
    const hash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : '';
    const hashParams = new URLSearchParams(hash);
    const accessToken = hashParams.get('access_token');

    if (accessToken) {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => res.json())
        .then(async (discordUser) => {
          if (discordUser?.id) {
            const avatarUrl = discordUser.avatar
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=256`
              : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.discriminator || '0', 10) % 5}.png`;

            const userPayload = {
              id: discordUser.id,
              username: discordUser.username,
              global_name: discordUser.global_name || discordUser.username,
              avatar: avatarUrl,
              email: discordUser.email || '',
            };

            if (window.opener && window.opener !== window) {
              window.opener.postMessage({ type: 'DISCORD_AUTH_SUCCESS', discordUser: userPayload }, '*');
              setTimeout(() => window.close(), 400);
            } else {
              const profile = await getUserProfileFromFirestore(userPayload.id);
              if (profile) {
                handleDiscordLoginSuccess(profile);
              } else {
                handleNeedRegistration(userPayload);
              }
            }
          }
        })
        .catch((err) => {
          console.error('Failed to fetch Discord user from token:', err);
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const discordCode = urlParams.get('code');
    if (discordCode) {
      const isVercel = window.location.origin.includes('hufflepuffhogworlds.vercel.app');
      const registeredRedirectUri = isVercel
        ? 'https://hufflepuffhogworlds.vercel.app/'
        : `${window.location.origin}/auth/discord/callback`;

      // If running inside popup window, exchange and notify opener
      if (window.opener && window.opener !== window) {
        fetch('/api/auth/discord/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: discordCode, redirect_uri: registeredRedirectUri }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.user) {
              window.opener.postMessage({ type: 'DISCORD_AUTH_SUCCESS', discordUser: data.user }, '*');
              setTimeout(() => window.close(), 500);
            } else {
              window.opener.postMessage({ type: 'DISCORD_CODE_RECEIVED', code: discordCode }, '*');
              setTimeout(() => window.close(), 1000);
            }
          })
          .catch(() => {
            window.opener.postMessage({ type: 'DISCORD_CODE_RECEIVED', code: discordCode }, '*');
            setTimeout(() => window.close(), 1000);
          });
      } else {
        // Running in main tab
        window.history.replaceState({}, document.title, window.location.pathname);
        fetch('/api/auth/discord/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: discordCode, redirect_uri: registeredRedirectUri }),
        })
          .then((res) => res.json())
          .then(async (data) => {
            if (data?.user) {
              const discordUser = data.user;
              const profile = await getUserProfileFromFirestore(discordUser.id);
              if (profile) {
                handleDiscordLoginSuccess(profile);
              } else {
                handleNeedRegistration({
                  id: discordUser.id,
                  username: discordUser.username,
                  global_name: discordUser.global_name || discordUser.username,
                  avatar: discordUser.avatar,
                });
              }
            }
          })
          .catch((err) => {
            console.error('Failed to exchange Discord code on main tab:', err);
          });
      }
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

  // Dedicated Website Owner Role Assignment Handler
  const handleUpdateMemberRoles = async (
    memberDiscordId: string,
    updatedRoles: HouseRole[],
    primaryRole?: HouseRole
  ) => {
    const resolvedPrimary = primaryRole || updatedRoles[0] || 'นักเรียนทั่วไป';

    // 1. Update local members state immediately for snappy response
    setMembersData((prev) =>
      prev.map((m) => {
        const matches =
          m.id === memberDiscordId ||
          m.id === `mem-${memberDiscordId}` ||
          m.studentId === memberDiscordId;
        if (matches) {
          return {
            ...m,
            role: resolvedPrimary,
            roles: updatedRoles,
          };
        }
        return m;
      })
    );

    // 2. If updating current logged in user, sync userProfile
    if (userProfile.discordId === memberDiscordId) {
      setUserProfile((prev) => ({
        ...prev,
        houseRole: resolvedPrimary,
        houseRoles: updatedRoles,
      }));
    }

    // 3. Persist to Firestore
    try {
      await updateMemberRolesInFirestore(memberDiscordId, updatedRoles, resolvedPrimary);
    } catch (err) {
      console.warn('Syncing roles to Firestore:', err);
    }

    // 4. Persist to server API
    try {
      await fetch(`/api/users/${memberDiscordId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          houseRoles: updatedRoles,
          houseRole: resolvedPrimary,
        }),
      });
    } catch (err) {
      console.warn('Syncing roles to Server:', err);
    }
  };

  const handleOwnerAuthenticated = () => {
    setUserProfile((prev) => {
      const existing = prev.houseRoles || [prev.houseRole];
      const updatedRoles: HouseRole[] = ['เจ้าของเว็บ', ...existing.filter((r) => r !== 'เจ้าของเว็บ')];
      const updated: StudentProfile = {
        ...prev,
        isOwner: true,
        houseRole: 'เจ้าของเว็บ',
        houseRoles: updatedRoles,
      };

      if (updated.discordId) {
        saveUserProfileToFirestore(updated).catch(console.warn);
      }
      return updated;
    });
  };

  const handleOwnerRevoked = () => {
    setUserProfile((prev) => {
      const remaining = (prev.houseRoles || []).filter((r) => r !== 'เจ้าของเว็บ');
      const updatedRoles = remaining.length > 0 ? remaining : (['หัวหน้าบ้าน'] as HouseRole[]);
      const updated: StudentProfile = {
        ...prev,
        isOwner: false,
        houseRole: updatedRoles[0],
        houseRoles: updatedRoles,
      };

      if (updated.discordId) {
        saveUserProfileToFirestore(updated).catch(console.warn);
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
    localStorage.removeItem('hufflepuff_owner_authenticated');
    setActiveDiscordUser(null);
    setUserStatus('guest');
    setCurrentView('landing');
  };

  // If on Landing page
  if (currentView === 'landing') {
    return (
      <LandingView
        onLoginSuccess={handleDiscordLoginSuccess}
        onDiscordLoginSuccess={handleDiscordLoginSuccess}
        onNeedRegistration={handleNeedRegistration}
      />
    );
  }

  // If on Registration page
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
        onOpenOwnerAuth={() => setShowOwnerAuthModal(true)}
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
            <MembersDirectoryTab
              members={membersData}
              currentUser={userProfile}
              onUpdateMemberRoles={handleUpdateMemberRoles}
            />
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

      {/* Owner Authentication Modal */}
      <OwnerAuthModal
        isOpen={showOwnerAuthModal}
        onClose={() => setShowOwnerAuthModal(false)}
        isOwnerAuthenticated={isOwner(userProfile)}
        onAuthenticated={handleOwnerAuthenticated}
        onRevoke={handleOwnerRevoked}
      />
    </div>
  );
}
