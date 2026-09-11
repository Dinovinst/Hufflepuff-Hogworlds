import React, { useState } from 'react';
import { SpellCategory, SpellItem, StudentProfile, DirectoryMember } from '../types';
import { HOGWORLDS_CURRICULUM } from '../data/hufflepuffData';
import { 
  Wand2, 
  Search, 
  Copy, 
  Check, 
  Sparkles, 
  Shield, 
  Skull, 
  HeartHandshake, 
  SlidersHorizontal,
  Flame,
  Zap,
  Info,
  CheckCircle2,
  Circle,
  Users,
  Award,
  BookOpen,
  Filter,
  GraduationCap,
  ChevronRight,
  X
} from 'lucide-react';

interface SpellsLoreTabProps {
  spellsData: SpellItem[];
  userProfile?: StudentProfile;
  members?: DirectoryMember[];
  onTogglePossessedSpell?: (spellId: string) => void;
}

export const SpellsLoreTab: React.FC<SpellsLoreTabProps> = ({ 
  spellsData,
  userProfile,
  members = [],
  onTogglePossessedSpell,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | SpellCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'All' | 'other'>('All');
  const [possessionFilter, setPossessionFilter] = useState<'all' | 'possessed' | 'unpossessed'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [castingSpell, setCastingSpell] = useState<SpellItem | null>(null);
  const [viewingPossessorsSpell, setViewingPossessorsSpell] = useState<SpellItem | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'roster'>('catalog');
  const [rosterSearch, setRosterSearch] = useState('');

  const userPossessedSpells = userProfile?.possessedSpells || [];

  // Helper to check if a spell is possessed by the current user
  const isSpellPossessed = (spell: SpellItem | { id: string; name: string }) => {
    return (
      userPossessedSpells.includes(spell.id) ||
      userPossessedSpells.some(
        (s) => s.toLowerCase() === spell.name.toLowerCase() || s.toLowerCase() === spell.id.toLowerCase()
      )
    );
  };

  // Categories
  const categories: { id: 'All' | SpellCategory; label: string; count: number; icon: any; color: string }[] = [
    {
      id: 'All',
      label: 'ทั้งหมด',
      count: spellsData.length,
      icon: Wand2,
      color: 'text-amber-300',
    },
    {
      id: 'Basic',
      label: 'Basic (คาถาพื้นฐาน)',
      count: spellsData.filter((s) => s.category === 'Basic').length,
      icon: Sparkles,
      color: 'text-[#FEE101]',
    },
    {
      id: 'Curse',
      label: 'Curse (คำสาป & ด้านมืด)',
      count: spellsData.filter((s) => s.category === 'Curse').length,
      icon: Skull,
      color: 'text-rose-400',
    },
    {
      id: 'Protect',
      label: 'Protect (คาถาป้องกัน)',
      count: spellsData.filter((s) => s.category === 'Protect').length,
      icon: Shield,
      color: 'text-cyan-400',
    },
    {
      id: 'Treat',
      label: 'Treat (คาถารักษา & ฟื้นฟู)',
      count: spellsData.filter((s) => s.category === 'Treat').length,
      icon: HeartHandshake,
      color: 'text-emerald-400',
    },
  ];

  // Filter spells
  const filteredSpells = spellsData.filter((spell) => {
    const matchesCat = selectedCategory === 'All' ? true : spell.category === selectedCategory;
    const matchesYear =
      selectedYear === 'All'
        ? true
        : selectedYear === 'other'
        ? spell.minYear > 3
        : spell.minYear === selectedYear;

    // Check possession
    const isPossessed = isSpellPossessed(spell);
    const matchesPossession =
      possessionFilter === 'all'
        ? true
        : possessionFilter === 'possessed'
        ? isPossessed
        : !isPossessed;

    const matchesSearch =
      spell.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spell.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spell.effect.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (spell.slashCommand && spell.slashCommand.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCat && matchesYear && matchesPossession && matchesSearch;
  });

  const handleTogglePossession = (spellId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTogglePossessedSpell) {
      onTogglePossessedSpell(spellId);
    }
  };

  const getCategoryBadge = (category: SpellCategory) => {
    switch (category) {
      case 'Curse':
        return 'bg-rose-950/80 text-rose-300 border-rose-600/40';
      case 'Protect':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
      case 'Treat':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      case 'Basic':
      default:
        return 'bg-amber-950/80 text-[#FEE101] border-[#FEE101]/40';
    }
  };

  // Find members who possess a specific spell
  const getMembersWithSpell = (spell: SpellItem) => {
    return members.filter(
      (m) =>
        m.possessedSpells &&
        (m.possessedSpells.includes(spell.id) ||
          m.possessedSpells.some(
            (s) => s.toLowerCase() === spell.name.toLowerCase() || s.toLowerCase() === spell.id.toLowerCase()
          ))
    );
  };

  // Mastery percentage
  const myMasteryCount = userPossessedSpells.length;
  const myMasteryPercent = Math.round((myMasteryCount / spellsData.length) * 100);

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="bg-[#141418] border border-[#FEE101]/25 rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-[#FEE101]/30 text-xs font-semibold text-[#FEE101] mb-2">
            <Wand2 className="w-3.5 h-3.5" />
            <span>Hogwarts Spell Compendium & Mastery Tracker • FiveM SRP</span>
          </div>
          <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-amber-100">
            ตำราคาถาและระบบบันทึกคาถาที่ครอบครอง
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            รวบรวมคาถาครบทั้ง {spellsData.length} บท สมาชิกสามารถติ๊กบันทึกคาถาที่มี และตรวจสอบรายชื่อผู้ถือครองคาถาได้
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อคาถา, คำสั่ง /cast, คุณสมบัติ..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0f0f13] border border-[#FEE101]/30 focus:border-[#FEE101] text-xs sm:text-sm text-amber-50 outline-none transition-all placeholder:text-neutral-600"
          />
        </div>
      </div>

      {/* Mode Switcher: Spell Catalog vs Member Spellbook Roster */}
      <div className="flex items-center justify-between gap-4 bg-[#141418] p-2.5 rounded-2xl border border-neutral-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-[#FEE101] text-neutral-950 shadow-md font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>คลังตำราคาถา ({spellsData.length} คาถา)</span>
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-[#FEE101] text-neutral-950 shadow-md font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>ทำเนียบคาถาของสมาชิกในบ้าน ({members.length} คน)</span>
          </button>
        </div>

        {/* Active user quick stats */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-300 pr-2">
          <Award className="w-4 h-4 text-[#FEE101]" />
          <span>คาถาที่คุณครอบครอง: <strong className="text-[#FEE101]">{myMasteryCount}</strong> / {spellsData.length}</span>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* User Spell Mastery Progress Bar */}
          <div className="bg-[#141418] border border-neutral-800 p-5 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FEE101]" />
                <h3 className="text-sm font-semibold text-amber-200">
                  ระดับความเชี่ยวชาญคาถาของคุณ ({userProfile?.name || 'สมาชิก'})
                </h3>
              </div>
              <div className="text-xs text-neutral-400">
                ครอบครองแล้ว <strong className="text-[#FEE101] font-bold text-sm">{myMasteryCount}</strong> จากทั้งหมด {spellsData.length} คาถา ({myMasteryPercent}%)
              </div>
            </div>

            {/* Progress track */}
            <div className="w-full bg-[#0d0d10] h-3 rounded-full overflow-hidden border border-neutral-800 p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber-600 via-[#FEE101] to-amber-300 transition-all duration-500 shadow-[0_0_12px_rgba(254,225,1,0.5)]"
                style={{ width: `${Math.min(100, Math.max(2, myMasteryPercent))}%` }}
              />
            </div>

            {/* Possession Quick Filter Buttons */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-800/80 flex-wrap">
              <span className="text-xs text-neutral-400 flex items-center gap-1 mr-2">
                <Filter className="w-3.5 h-3.5 text-[#FEE101]" />
                <span>กรองสถานะการมีคาถา:</span>
              </span>

              <button
                onClick={() => setPossessionFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  possessionFilter === 'all'
                    ? 'bg-[#FEE101] text-neutral-950 font-bold'
                    : 'bg-[#18181f] text-neutral-300 hover:text-white border border-neutral-800'
                }`}
              >
                ทั้งหมด ({spellsData.length})
              </button>

              <button
                onClick={() => setPossessionFilter('possessed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  possessionFilter === 'possessed'
                    ? 'bg-emerald-500 text-neutral-950 font-bold'
                    : 'bg-[#18181f] text-neutral-300 hover:text-white border border-neutral-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>คาถาที่ฉันมีแล้ว ({myMasteryCount})</span>
              </button>

              <button
                onClick={() => setPossessionFilter('unpossessed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  possessionFilter === 'unpossessed'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-[#18181f] text-neutral-300 hover:text-white border border-neutral-800'
                }`}
              >
                <Circle className="w-3.5 h-3.5 text-neutral-400" />
                <span>คาถาที่ยังไม่มี ({spellsData.length - myMasteryCount})</span>
              </button>
            </div>
          </div>

          {/* Hogworlds Year 1-3 Official Curriculum Overview */}
          <div className="bg-[#141418] border border-amber-500/20 rounded-3xl p-5 sm:p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-400/30 text-[#FEE101]">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cinzel text-base sm:text-lg font-bold text-amber-100 flex items-center gap-2">
                    <span>หลักสูตรคาถาตามระดับชั้นปี</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 border border-amber-400/30 text-[#FEE101]">
                      ชั้นปี 1 - 3 (18 คาถาหลัก)
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    คาถาตามหลักสูตรทางการของโรงเรียนฮอกวอตส์ FiveM SRP จัดเรียงตามระดับชั้นปี
                  </p>
                </div>
              </div>

              {selectedYear !== 'All' && (
                <button
                  onClick={() => setSelectedYear('All')}
                  className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 transition-colors self-start sm:self-auto cursor-pointer"
                >
                  รีเซ็ตแสดงทุกชั้นปี
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {HOGWORLDS_CURRICULUM.map((curr) => {
                const yearSpells = curr.spellIds
                  .map((id) => spellsData.find((s) => s.id === id))
                  .filter((s): s is SpellItem => Boolean(s));
                const learnedCount = yearSpells.filter((s) => isSpellPossessed(s)).length;
                const isSelected = selectedYear === curr.year;
                const percent = Math.round((learnedCount / (yearSpells.length || 1)) * 100);

                return (
                  <div
                    key={curr.year}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#181822] border-[#FEE101] shadow-lg shadow-amber-500/10'
                        : 'bg-[#101014] border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${curr.badgeBg}`}>
                          {curr.badgeLabel}
                        </span>
                        <span className="text-xs font-semibold text-neutral-300">
                          {learnedCount}/{yearSpells.length} คาถา
                        </span>
                      </div>

                      {/* Mini progress */}
                      <div className="w-full bg-[#08080a] h-1.5 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: curr.themeColor,
                          }}
                        />
                      </div>

                      {/* Spell chips */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {yearSpells.map((sp) => {
                          const possessed = isSpellPossessed(sp);
                          return (
                            <button
                              key={sp.id}
                              onClick={() => setCastingSpell(sp)}
                              title={`คลิกดูรายละเอียดคาถา ${sp.name}`}
                              className={`text-[11px] px-2 py-1 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                                possessed
                                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200 hover:border-emerald-400'
                                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                              }`}
                            >
                              {possessed ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Circle className="w-2.5 h-2.5 text-neutral-500" />
                              )}
                              <span>{sp.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedYear(isSelected ? 'All' : curr.year)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#FEE101] text-neutral-950 border-[#FEE101] font-bold shadow-md shadow-amber-500/20'
                          : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <span>{isSelected ? '✓ กำลังกรองชั้นปีนี้' : `กรองดูเฉพาะชั้นปี ${curr.year}`}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters Section: Year Filter & Category Tabs Bar */}
          <div className="space-y-3">
            {/* Year Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs text-neutral-400 font-medium whitespace-nowrap flex items-center gap-1 mr-1">
                <GraduationCap className="w-3.5 h-3.5 text-[#FEE101]" />
                <span>ระดับชั้นปี:</span>
              </span>

              {[
                { id: 'All', label: 'ทุกชั้นปี' },
                { id: 1, label: 'ชั้นปี 1 (4 คาถา)' },
                { id: 2, label: 'ชั้นปี 2 (7 คาถา)' },
                { id: 3, label: 'ชั้นปี 3 (7 คาถา)' },
                { id: 'other', label: 'ชั้นปี 4-7 / อื่นๆ' },
              ].map((y) => {
                const isSelected = selectedYear === y.id;
                return (
                  <button
                    key={String(y.id)}
                    onClick={() => setSelectedYear(y.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400/20 text-[#FEE101] border-[#FEE101] shadow-sm font-bold'
                        : 'bg-[#18181f] text-neutral-400 hover:text-white border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {y.label}
                  </button>
                );
              })}
            </div>

            {/* Category Tabs Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer ${
                      isSelected
                        ? 'bg-[#FEE101] text-neutral-950 border-[#FEE101] shadow-md shadow-[#FEE101]/25 font-bold'
                        : 'bg-[#18181f] text-neutral-300 hover:text-white border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-neutral-950' : cat.color}`} />
                    <span>{cat.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected ? 'bg-neutral-900 text-[#FEE101]' : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spells Count */}
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="text-neutral-400">
              ตัวกรอง: <strong className="text-[#FEE101]">{selectedCategory === 'All' ? 'ทุกหมวดหมู่' : selectedCategory}</strong> • <strong className="text-amber-300">{selectedYear === 'All' ? 'ทุกชั้นปี' : selectedYear === 'other' ? 'ชั้นปี 4-7' : `ชั้นปี ${selectedYear}`}</strong>
            </span>
            <span className="text-neutral-400">
              แสดง {filteredSpells.length} จากทั้งหมด {spellsData.length} คาถา
            </span>
          </div>

          {/* Spells Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSpells.map((spell) => {
              const isPossessed = isSpellPossessed(spell);
              const possessors = getMembersWithSpell(spell);

              return (
                <div
                  key={spell.id}
                  onClick={() => setCastingSpell(spell)}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-lg hover:shadow-black/60 relative overflow-hidden ${
                    isPossessed
                      ? 'bg-[#16181b] border-emerald-500/40 hover:border-emerald-400'
                      : 'bg-[#141418] border-neutral-800 hover:border-[#FEE101]/50 hover:bg-[#191920]'
                  }`}
                >
                  {/* Category color indicator strip */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      spell.category === 'Curse'
                        ? 'bg-rose-600'
                        : spell.category === 'Protect'
                        ? 'bg-cyan-500'
                        : spell.category === 'Treat'
                        ? 'bg-emerald-500'
                        : 'bg-[#FEE101]'
                    }`}
                  />

                  <div>
                    {/* Header: Name + Possession Checkbox Toggle */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-cinzel text-lg font-bold text-amber-50 group-hover:text-[#FEE101] transition-colors">
                          {spell.name}
                        </h3>
                      </div>

                      {/* Possession Toggle Button */}
                      <button
                        onClick={(e) => handleTogglePossession(spell.id, e)}
                        title={isPossessed ? 'คลิกเพื่อยกเลิกการครอบครอง' : 'คลิกเพื่อติ๊กบันทึกว่ามีคาถานี้แล้ว'}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isPossessed
                            ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                            : 'bg-neutral-900/90 border-neutral-700 text-neutral-400 hover:border-[#FEE101] hover:text-amber-200'
                        }`}
                      >
                        {isPossessed ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>มีคาถาแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-3.5 h-3.5" />
                            <span>ติ๊กมีคาถา</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Badges: Category, Year & Member count */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadge(spell.category)}`}>
                        {spell.category}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          spell.minYear === 1
                            ? 'bg-amber-500/15 text-[#FEE101] border-amber-400/40'
                            : spell.minYear === 2
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                            : spell.minYear === 3
                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                        }`}
                      >
                        ชั้นปี {spell.minYear}
                      </span>

                      {/* Possessor members count pill */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingPossessorsSpell(spell);
                        }}
                        className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center gap-1 transition-colors cursor-pointer"
                        title="ดูว่ามีสมาชิกบ้านคนไหนครอบครองคาถานี้บ้าง"
                      >
                        <Users className="w-3 h-3 text-[#FEE101]" />
                        <span>มี {possessors.length} คน</span>
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-neutral-300 leading-relaxed mb-3 line-clamp-2">
                      {spell.description}
                    </p>

                    {/* Effect */}
                    <div className="p-2.5 rounded-xl bg-[#0d0d10] border border-neutral-800/80 text-[11px] text-neutral-300 flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 text-[#FEE101] flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{spell.effect}</span>
                    </div>

                    {/* Slash Command Pill */}
                    {spell.slashCommand && (
                      <div className="mt-2.5 flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#0a0a0d] border border-neutral-800/90 text-[11px] font-mono text-amber-200/90">
                        <span className="truncate">{spell.slashCommand}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(spell.slashCommand || '');
                            setCopiedId(spell.id);
                            setTimeout(() => setCopiedId(null), 1800);
                          }}
                          className="ml-2 text-neutral-400 hover:text-[#FEE101] flex-shrink-0 cursor-pointer p-0.5"
                          title="คัดลอกคำสั่งร่ายคาถา"
                        >
                          {copiedId === spell.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* ROSTER VIEW: Member Spellbook Registry */
        <div className="space-y-6">
          <div className="bg-[#141418] border border-neutral-800 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-cinzel text-lg font-bold text-amber-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#FEE101]" />
                <span>ตรวจสอบข้อมูลการถือครองคาถาของสมาชิกทุกคน</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                ดูได้ว่าสมาชิกคนใดมีหรือขาดคาถาใดบ้าง สะดวกต่อการจัดทีมลงเรด การประลองเวทย์ และการเรียนการสอน
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="ค้นหาชื่อสมาชิก..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#0f0f13] border border-neutral-700 text-xs text-amber-50 outline-none"
              />
            </div>
          </div>

          {/* Members Spell List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members
              .filter((m) => m.name.toLowerCase().includes(rosterSearch.toLowerCase()))
              .map((member) => {
                const memberSpells = member.possessedSpells || [];
                const percent = Math.round((memberSpells.length / spellsData.length) * 100);

                return (
                  <div
                    key={member.id}
                    className="p-5 rounded-2xl bg-[#141418] border border-neutral-800 hover:border-[#FEE101]/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Member Info Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-12 h-12 rounded-xl object-cover border border-[#FEE101]/60"
                          />
                          <div>
                            <h4 className="font-semibold text-sm text-amber-50">
                              {member.name}
                            </h4>
                            <p className="text-xs text-neutral-400">
                              ปี {member.year} • {member.role}
                            </p>
                            <span className="text-[10px] font-mono text-neutral-500">
                              {member.studentId}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-950/80 border border-[#FEE101]/40 text-[#FEE101] text-xs font-bold">
                            {memberSpells.length} คาถา
                          </span>
                          <p className="text-[10px] text-neutral-400 mt-0.5">{percent}%</p>
                        </div>
                      </div>

                      {/* Mini progress bar */}
                      <div className="w-full bg-[#0a0a0d] h-2 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${Math.max(2, percent)}%` }}
                        />
                      </div>

                      {/* Badges of Possessed Spells */}
                      <div className="text-[11px] text-neutral-400 mb-2">
                        คาถาที่ครอบครองแล้ว:
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                        {memberSpells.length === 0 ? (
                          <span className="text-xs text-neutral-500 italic">ยังไม่มีข้อมูลการบันทึกคาถา</span>
                        ) : (
                          memberSpells.map((spId) => {
                            const spellObj = spellsData.find((s) => s.id === spId);
                            return (
                              <span
                                key={spId}
                                className="px-2 py-0.5 rounded-md bg-[#0f0f13] border border-neutral-800 text-[11px] text-amber-200"
                              >
                                {spellObj ? spellObj.name : spId}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Spell Detail / Simulator Modal */}
      {castingSpell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#16161d] border-2 border-[#FEE101] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_0_60px_rgba(254,225,1,0.25)] text-left relative overflow-hidden">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className={`text-[11px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadge(castingSpell.category)}`}>
                    {castingSpell.category}
                  </span>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      castingSpell.minYear === 1
                        ? 'bg-amber-500/15 text-[#FEE101] border-amber-400/50'
                        : castingSpell.minYear === 2
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/50'
                        : castingSpell.minYear === 3
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/50'
                        : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    ชั้นปี {castingSpell.minYear}
                  </span>

                  {[1, 2, 3].includes(castingSpell.minYear) && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-[#FEE101]" />
                      <span>หลักสูตรทางการปี {castingSpell.minYear}</span>
                    </span>
                  )}
                </div>

                <h3 className="font-cinzel text-2xl font-black text-[#FEE101]">
                  {castingSpell.name}
                </h3>
              </div>

              <button
                onClick={() => setCastingSpell(null)}
                className="text-neutral-400 hover:text-white p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Possession status inside modal */}
            <div className="mb-4 p-3 rounded-xl bg-[#0f0f13] border border-[#FEE101]/30 flex items-center justify-between">
              <span className="text-xs text-neutral-300">
                สถานะการถือครองคาถานี้ของคุณ:
              </span>
              <button
                onClick={(e) => handleTogglePossession(castingSpell.id, e)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSpellPossessed(castingSpell)
                    ? 'bg-emerald-500 text-neutral-950 font-bold'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {isSpellPossessed(castingSpell) ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>ครอบครองแล้ว</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-3.5 h-3.5" />
                    <span>กดเพื่อบันทึกว่ามีคาถา</span>
                  </>
                )}
              </button>
            </div>

            {/* Spell Details */}
            <div className="space-y-3.5 mb-6">
              <div className="p-4 rounded-2xl bg-[#0f0f13] border border-[#FEE101]/20">
                <p className="text-xs uppercase tracking-wider text-amber-300 font-semibold mb-1">
                  คำอธิบายและประวัติคาถา
                </p>
                <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                  {castingSpell.description}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0f0f13] border border-neutral-800">
                <p className="text-xs uppercase tracking-wider text-[#FEE101] font-semibold mb-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>ผลลัพธ์ในเกม FiveM SRP</span>
                </p>
                <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                  {castingSpell.effect}
                </p>
              </div>

              {castingSpell.slashCommand && (
                <div className="p-3.5 rounded-2xl bg-[#0a0a0e] border border-neutral-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-neutral-400">คำสั่งร่ายในเกม (Slash Command)</p>
                    <p className="font-mono text-xs text-[#FEE101] font-bold mt-0.5">{castingSpell.slashCommand}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(castingSpell.slashCommand || '');
                      setCopiedId(castingSpell.id);
                      setTimeout(() => setCopiedId(null), 1800);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs flex items-center gap-1 cursor-pointer border border-neutral-700"
                  >
                    {copiedId === castingSpell.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอก</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setCastingSpell(null)}
              className="w-full py-3 rounded-xl bg-[#201e18] hover:bg-[#2c2921] border border-[#FEE101]/40 text-amber-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              ปิดหน้าต่างตำราคาถา
            </button>
          </div>
        </div>
      )}

      {/* Possessors List Modal */}
      {viewingPossessorsSpell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#16161d] border-2 border-[#FEE101] rounded-3xl max-w-md w-full p-6 shadow-2xl text-left relative">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#FEE101]">
                  รายชื่อผู้ครอบครองคาถา
                </span>
                <h3 className="font-cinzel text-lg font-bold text-amber-50">
                  {viewingPossessorsSpell.name}
                </h3>
              </div>
              <button
                onClick={() => setViewingPossessorsSpell(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {getMembersWithSpell(viewingPossessorsSpell).length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  ยังไม่มีสมาชิกคนใดบันทึกว่ามีคาถานี้
                </div>
              ) : (
                getMembersWithSpell(viewingPossessorsSpell).map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-[#0f0f13] border border-neutral-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="w-9 h-9 rounded-lg object-cover border border-[#FEE101]/40"
                      />
                      <div>
                        <p className="text-xs font-semibold text-amber-100">{m.name}</p>
                        <p className="text-[10px] text-neutral-400">{m.role} • ปี {m.year}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500">{m.studentId}</span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setViewingPossessorsSpell(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#FEE101] text-neutral-950 font-semibold text-xs cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
