import React, { useState } from 'react';
import { DirectoryMember, HouseRole } from '../types';
import { HOUSE_ROLES_LIST } from '../data/hufflepuffData';
import { 
  Users, 
  Search, 
  Shield, 
  GraduationCap, 
  Circle, 
  Crown, 
  ShieldAlert, 
  BookOpen, 
  Trophy, 
  Smile, 
  Sparkles, 
  LayoutGrid, 
  Layers,
  Wand2,
  X
} from 'lucide-react';

interface MembersDirectoryTabProps {
  members: DirectoryMember[];
}

interface RoleGroup {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  roles: HouseRole[];
}

const ROLE_GROUPS: RoleGroup[] = [
  {
    id: 'leadership',
    title: 'คณะผู้บริหารและคณาจารย์ประจำบ้าน (House Leadership)',
    subtitle: 'หัวหน้าบ้าน, Badger Leader, ศาสตราจารย์ และผู้ดูแลระดับสูง',
    icon: Crown,
    color: 'text-[#FEE101]',
    roles: ['หัวหน้าบ้าน', 'Badger Leader', 'ศาสตราจารย์ประจำบ้าน', 'แอดมิน'],
  },
  {
    id: 'prefects',
    title: 'คณะพรีเฟ็คต์และผู้ช่วย (Prefects & House Helpers)',
    subtitle: 'ผู้ดูแลกฎระเบียบห้องนั่งเล่นรวมและให้ความช่วยเหลือนักเรียนรุ่นน้อง',
    icon: Shield,
    color: 'text-amber-400',
    roles: ['Prefect', 'Helper'],
  },
  {
    id: 'academics',
    title: 'ฝ่ายวิชาการและการแข่งขัน (Academics & Competitive)',
    subtitle: 'ผู้ดูแลคลังตำรา การสอนคาถา และการแข่งขันระดับปราสาท',
    icon: BookOpen,
    color: 'text-blue-400',
    roles: ['Badger วิชาการ', 'Badger แข่งขัน'],
  },
  {
    id: 'athletics',
    title: 'ทีมนักกีฬาและกิจกรรมประจำบ้าน (Athletics & Activities)',
    subtitle: 'นักกีฬาควิดดิช ไม้กวาด ประลองเวทย์ดูเอลลิ่ง เชียร์ลีดเดอร์ และกิจกรรมบ้าน',
    icon: Trophy,
    color: 'text-amber-300',
    roles: [
      'Badger กิจกรรม',
      'นักกีฬาไม้กวาด',
      'นักกีฬาประลองเวทย์',
      'นักกีฬา SAS',
      'นักกีฬาเชียร์ลีดเดอร์',
    ],
  },
  {
    id: 'students',
    title: 'นักเรียนและสมาชิกบ้านทั่วไป (General Students)',
    subtitle: 'นักเรียนบ้านฮัฟเฟิลพัฟชั้นปีที่ 1 ถึง 7',
    icon: Smile,
    color: 'text-neutral-300',
    roles: ['นักเรียนทั่วไป'],
  },
];

export const MembersDirectoryTab: React.FC<MembersDirectoryTabProps> = ({ members }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grouped' | 'grid'>('grouped');
  const [selectedMember, setSelectedMember] = useState<DirectoryMember | null>(null);

  // Filter members by search and single role
  const filteredMembers = members.filter((member) => {
    const memberRoles = member.roles || [member.role];
    const matchesRole =
      selectedRoleFilter === 'All'
        ? true
        : memberRoles.includes(selectedRoleFilter as HouseRole);
    
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getStatusIndicator = (status: DirectoryMember['status']) => {
    switch (status) {
      case 'in-game':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>In-Game (ในเซิร์ฟ)</span>
          </span>
        );
      case 'online':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Online</span>
          </span>
        );
      case 'offline':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-700">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
            <span>Offline</span>
          </span>
        );
    }
  };

  const renderMemberCard = (member: DirectoryMember) => {
    const rolesList = member.roles && member.roles.length > 0 ? member.roles : [member.role];
    const spellCount = member.possessedSpells ? member.possessedSpells.length : 0;

    return (
      <div
        key={member.id}
        onClick={() => setSelectedMember(member)}
        className="p-5 rounded-2xl bg-[#141418] border border-neutral-800 hover:border-[#FEE101]/50 hover:bg-[#181820] transition-all flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-lg relative"
      >
        <div>
          {/* Top Avatar & Status */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="relative">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#FEE101]/60 shadow-md group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#141418] rounded-full" />
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-amber-200">
                ปี {member.year}
              </span>
              <p className="text-[10px] font-mono text-neutral-500 mt-1">
                ID: {member.studentId}
              </p>
            </div>
          </div>

          {/* Member Name */}
          <h3 className="font-semibold text-base text-amber-50 group-hover:text-[#FEE101] transition-colors mb-1.5">
            {member.name}
          </h3>

          {/* Multi-role badges */}
          <div className="flex flex-wrap gap-1 mb-2.5">
            {rolesList.map((r, idx) => (
              <span
                key={idx}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 border border-[#FEE101]/40 text-[#FEE101]"
              >
                {r}
              </span>
            ))}
          </div>

          {/* Specialty / Roleplay duty */}
          <p className="text-xs text-neutral-300 line-clamp-2 bg-[#0d0d10] p-2.5 rounded-xl border border-neutral-800/80 mb-3">
            {member.specialty}
          </p>
        </div>

        {/* Footer: Status + Spell Mastery count */}
        <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
          {getStatusIndicator(member.status)}

          <span 
            className="text-[11px] text-amber-300 flex items-center gap-1 bg-[#0a0a0d] px-2 py-0.5 rounded-lg border border-neutral-800"
            title={`${member.name} ครอบครอง ${spellCount} คาถา`}
          >
            <Wand2 className="w-3 h-3 text-[#FEE101]" />
            <span>{spellCount} คาถา</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#141418] border border-[#FEE101]/25 rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-[#FEE101]/30 text-xs font-semibold text-[#FEE101] mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Hufflepuff House Registry & Hierarchy • FiveM SRP</span>
          </div>
          <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-amber-100">
            ทำเนียบสมาชิกบ้านฮัฟเฟิลพัฟ (แยกตามตำแหน่ง)
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            จัดหมวดหมู่แยกตามบทบาทหน้าที่ในบ้าน: ฝ่ายบริหาร, พรีเฟ็คต์, วิชาการ, นักกีฬา และนักเรียนทั่วไป
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, รหัสนักศึกษา, สายงาน..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0f0f13] border border-[#FEE101]/30 focus:border-[#FEE101] text-xs sm:text-sm text-amber-50 outline-none transition-all placeholder:text-neutral-600"
          />
        </div>
      </div>

      {/* Mode Switcher & Role Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#141418] p-3 rounded-2xl border border-neutral-800">
        {/* Role Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedRoleFilter('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedRoleFilter === 'All'
                ? 'bg-[#FEE101] text-neutral-950 shadow-sm'
                : 'bg-[#18181f] text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            ตำแหน่งทั้งหมด ({members.length})
          </button>
          {HOUSE_ROLES_LIST.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedRoleFilter === r
                  ? 'bg-[#FEE101] text-neutral-950 shadow-sm font-semibold'
                  : 'bg-[#18181f] text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* View Mode Switcher: Grouped vs Grid */}
        <div className="flex items-center gap-1 bg-[#0f0f13] p-1 rounded-xl border border-neutral-800 self-end md:self-auto flex-shrink-0">
          <button
            onClick={() => setViewMode('grouped')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'grouped'
                ? 'bg-[#FEE101] text-neutral-950 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>แยกตามหมวดหมู่</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[#FEE101] text-neutral-950 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>แสดงทั้งหมด</span>
          </button>
        </div>
      </div>

      {/* Main Members Display */}
      {members.length === 0 ? (
        <div className="py-20 text-center bg-[#141418] rounded-3xl border border-neutral-800 p-8">
          <div className="w-16 h-16 rounded-2xl bg-[#FEE101]/10 border border-[#FEE101]/20 flex items-center justify-center text-[#FEE101] mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-cinzel text-xl font-bold text-amber-100 mb-2">ยังไม่มีสมาชิกที่ลงทะเบียนในขณะนี้</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto">
            รายชื่อสมาชิกจะปรากฏขึ้นโดยอัตโนมัติเมื่อผู้เล่นเข้าสู่ระบบด้วย Discord และลงทะเบียนตัวละคร FiveM เข้าสู่บ้านฮัฟเฟิลพัฟสำเร็จ
          </p>
        </div>
      ) : viewMode === 'grouped' && selectedRoleFilter === 'All' ? (
        /* GROUPED BY ROLE HIERARCHY */
        <div className="space-y-8">
          {ROLE_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            // Find members who belong to any of this group's roles
            const groupMembers = filteredMembers.filter((m) => {
              const roles = m.roles || [m.role];
              return roles.some((r) => group.roles.includes(r));
            });

            if (groupMembers.length === 0) return null;

            return (
              <div
                key={group.id}
                className="bg-[#141418]/60 border border-neutral-800/80 rounded-3xl p-6"
              >
                {/* Group Header */}
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-[#FEE101]/30 flex items-center justify-center text-[#FEE101]">
                      <GroupIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-cinzel text-lg font-bold text-amber-100 flex items-center gap-2">
                        <span>{group.title}</span>
                      </h3>
                      <p className="text-xs text-neutral-400">{group.subtitle}</p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-amber-300">
                    {groupMembers.length} คน
                  </span>
                </div>

                {/* Group Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {groupMembers.map(renderMemberCard)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* STANDARD GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMembers.length === 0 ? (
            <div className="col-span-full py-16 text-center text-neutral-400 bg-[#141418] rounded-2xl border border-neutral-800">
              ไม่พบสมาชิกในตำแหน่งหรือคำค้นหานี้
            </div>
          ) : (
            filteredMembers.map(renderMemberCard)
          )}
        </div>
      )}

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#16161d] border-2 border-[#FEE101] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_0_50px_rgba(254,225,1,0.25)] text-left relative">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedMember.avatar}
                  alt={selectedMember.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#FEE101]"
                />
                <div>
                  <h3 className="font-cinzel text-xl font-bold text-amber-100">
                    {selectedMember.name}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    รหัสนักศึกษา: <span className="text-[#FEE101] font-mono font-semibold">{selectedMember.studentId}</span> • ปี {selectedMember.year}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    {getStatusIndicator(selectedMember.status)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedMember(null)}
                className="text-neutral-400 hover:text-white p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Role tags */}
            <div className="mb-4">
              <label className="text-[11px] uppercase tracking-wider text-neutral-400 block mb-1.5">
                ตำแหน่งที่ได้รับมอบหมาย
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(selectedMember.roles || [selectedMember.role]).map((r, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl bg-amber-950/80 border border-[#FEE101]/40 text-[#FEE101] text-xs font-semibold"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            {/* Specialty */}
            <div className="p-3.5 rounded-2xl bg-[#0f0f13] border border-neutral-800 mb-4">
              <p className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold mb-1">
                หน้าที่และความเชี่ยวชาญพิเศษ
              </p>
              <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                {selectedMember.specialty}
              </p>
            </div>

            {/* Possessed Spells List */}
            <div className="p-3.5 rounded-2xl bg-[#0f0f13] border border-neutral-800 mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-wider text-[#FEE101] font-semibold flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>คาถาที่ครอบครองแล้ว ({selectedMember.possessedSpells?.length || 0} คาถา)</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {!selectedMember.possessedSpells || selectedMember.possessedSpells.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic">ยังไม่ได้บันทึกคาถา</p>
                ) : (
                  selectedMember.possessedSpells.map((spId) => (
                    <span
                      key={spId}
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-amber-200"
                    >
                      {spId.replace('sp-', '')}
                    </span>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedMember(null)}
              className="w-full py-2.5 rounded-xl bg-[#FEE101] text-neutral-950 font-bold text-xs hover:bg-[#ffe83d] transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
