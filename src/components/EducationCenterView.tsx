import React, { useState } from 'react';
import { ClassScheduleTab } from './ClassScheduleTab';
import { SpellsLoreTab } from './SpellsLoreTab';
import { 
  ClassScheduleItem, 
  SpellItem, 
  StudentProfile,
  DirectoryMember
} from '../types';
import { 
  CalendarDays, 
  Wand2, 
  ArrowLeft
} from 'lucide-react';

interface EducationCenterViewProps {
  initialTab?: 'schedule' | 'spells';
  scheduleData: ClassScheduleItem[];
  onUpdateSchedule?: (schedule: ClassScheduleItem[]) => void;
  spellsData: SpellItem[];
  userProfile: StudentProfile;
  members?: DirectoryMember[];
  onTogglePossessedSpell?: (spellId: string) => void;
  onBackToDashboard: () => void;
}

export const EducationCenterView: React.FC<EducationCenterViewProps> = ({
  initialTab = 'schedule',
  scheduleData,
  onUpdateSchedule,
  spellsData,
  userProfile,
  members = [],
  onTogglePossessedSpell,
  onBackToDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'spells'>(initialTab);

  const tabs = [
    {
      id: 'schedule' as const,
      label: '1. ปฏิทินตารางเรียน (Class Schedule Calendar)',
      shortLabel: 'ตารางเรียน',
      icon: CalendarDays,
      count: scheduleData.length + ' คาบ',
    },
    {
      id: 'spells' as const,
      label: '2. ตำราคาถาและวิชาเรียน (Spells & Lore)',
      shortLabel: 'ตำราคาถา',
      icon: Wand2,
      count: spellsData.length + ' บท',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Navigation breadcrumb */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-neutral-400 hover:text-[#FEE101] transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>กลับสู่หน้าแดชบอร์ดหลัก</span>
        </button>

        <div className="text-xs text-neutral-400">
          ผู้ใช้งาน: <strong className="text-amber-200">{userProfile.name}</strong> ({userProfile.houseRoles ? userProfile.houseRoles.join(', ') : userProfile.houseRole} 🟡)
        </div>
      </div>

      {/* Main Tabs Navigation Bar */}
      <div className="mb-8 p-1.5 rounded-2xl bg-[#141418] border border-[#FEE101]/25 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#FEE101] text-neutral-950 shadow-md shadow-[#FEE101]/20 font-bold scale-[1.01]'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-neutral-950' : 'text-[#FEE101]'}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-black/20 text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      <div>
        {activeTab === 'schedule' && (
          <ClassScheduleTab
            scheduleData={scheduleData}
            userProfile={userProfile}
            onUpdateSchedule={onUpdateSchedule}
          />
        )}

        {activeTab === 'spells' && (
          <SpellsLoreTab 
            spellsData={spellsData}
            userProfile={userProfile}
            members={members}
            onTogglePossessedSpell={onTogglePossessedSpell}
          />
        )}
      </div>
    </div>
  );
};
