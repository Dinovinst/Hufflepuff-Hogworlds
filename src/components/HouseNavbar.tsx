import React, { useState, useEffect } from 'react';
import { HufflepuffCrest } from './HufflepuffCrest';
import { AppView, StudentProfile } from '../types';
import { isAdmin } from '../utils/permissions';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Wand2, 
  Package, 
  Users, 
  Clock, 
  LogOut, 
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

interface HouseNavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  userProfile: StudentProfile;
  onLogout: () => void;
  onEditProfile: () => void;
  onToggleAdmin?: () => void;
}

export const HouseNavbar: React.FC<HouseNavbarProps> = ({
  currentView,
  onNavigate,
  userProfile,
  onLogout,
  onEditProfile,
  onToggleAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [irlTime, setIrlTime] = useState('');
  const [rpTime, setRpTime] = useState('20:45 RP');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIrlTime(
        now.toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard' as AppView, label: 'แดชบอร์ดหลัก', icon: LayoutDashboard },
    { id: 'schedule' as AppView, label: 'ตารางเรียน', icon: CalendarDays },
    { id: 'spells' as AppView, label: 'คาถาและตำรา', icon: Wand2 },
    { id: 'members' as AppView, label: 'ทำเนียบสมาชิก', icon: Users },
  ];

  return (
    <nav className="w-full bg-[#111115] border-b border-[#FEE101]/25 sticky top-0 z-40 shadow-xl shadow-black/40">
      {/* Top microbar with Hogwarts In-Game RP status & Clock */}
      <div className="bg-[#0b0b0e] border-b border-neutral-800/80 px-4 sm:px-6 py-1 flex items-center justify-between text-[11px] text-neutral-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-amber-300/90 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#FEE101] animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#FEE101] -ml-2.5" />
            <span>Hogworlds Wizardry Project • Server Status: Online</span>
          </span>
          <span className="hidden md:inline text-neutral-600">|</span>
          <span className="hidden md:inline text-neutral-400">ห้องนั่งเล่นรวมข้างห้องครัว (Hufflepuff Basement)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-neutral-300">
            <Clock className="w-3 h-3 text-[#FEE101]" />
            <span>IRL: {irlTime || '19:00:00'}</span>
          </span>
          <span className="text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-[#FEE101]/30">
            {rpTime}
          </span>
        </div>
      </div>

      {/* Main Navbar Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Logo & House Title */}
        <div 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
        >
          <HufflepuffCrest size="sm" withGlow={true} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-cinzel text-base sm:text-lg font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-[#FFF59D] via-[#FEE101] to-[#C89B10] group-hover:brightness-125 transition-all">
                HUFFLEPUFF
              </span>
              <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-amber-950 border border-[#FEE101]/40 text-[#FEE101] font-semibold tracking-wider">
                FiveM
              </span>
            </div>
            <p className="text-[11px] text-amber-200/70 font-medium tracking-wide">
              Common Room & Community
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1 bg-[#18181f] p-1 rounded-xl border border-[#FEE101]/20">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#FEE101] text-neutral-950 shadow-md shadow-[#FEE101]/20 font-semibold'
                    : 'text-neutral-300 hover:text-amber-200 hover:bg-neutral-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-neutral-950' : 'text-[#FEE101]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User Mini Profile (According to specs: FiveM character image, In-game name, Year, Role tag e.g. Prefect 🟡) */}
        <div className="flex items-center gap-3">
          <div 
            onClick={onEditProfile}
            title="คลิกเพื่อดูหรือแก้ไขโปรไฟล์"
            className="flex items-center gap-3 p-1.5 pr-3 rounded-xl bg-[#16161c] border border-[#FEE101]/30 hover:border-[#FEE101] transition-all cursor-pointer group"
          >
            <div className="relative">
              <img
                src={userProfile.characterPhoto}
                alt={userProfile.name}
                className="w-10 h-10 rounded-lg object-cover border border-[#FEE101] group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#16161c] rounded-full" />
            </div>

            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white group-hover:text-[#FEE101] transition-colors line-clamp-1">
                  {userProfile.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-neutral-400">
                  ปี {userProfile.year}
                </span>
                <span className="text-neutral-600">•</span>
                {isAdmin(userProfile) ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-[#FEE101] text-[#FEE101] shadow-[0_0_10px_rgba(254,225,1,0.2)]">
                    <ShieldCheck className="w-3 h-3 text-[#FEE101]" />
                    <span>แอดมิน</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-950/80 border border-[#FEE101]/40 text-[#FEE101]">
                    <span>{userProfile.houseRole}</span>
                    <span className="text-amber-400">🟡</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Admin Role Toggle (For easy preview and testing permissions) */}
          {onToggleAdmin && (
            <button
              onClick={onToggleAdmin}
              title={isAdmin(userProfile) ? "คลิกเพื่อสลับเป็นยศนักเรียนทั่วไป (ทดสอบมุมมองนักเรียน)" : "คลิกเพื่อสลับเป็นยศแอดมิน (ทดสอบสิทธิ์จัดการ)"}
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isAdmin(userProfile)
                  ? 'bg-amber-500/10 border-[#FEE101] text-[#FEE101] hover:bg-amber-500/20'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAdmin(userProfile) ? 'โหมด: แอดมิน 🛡️' : 'สลับเป็น: แอดมิน'}</span>
            </button>
          )}

          {/* Logout / Switch User */}
          <button
            onClick={onLogout}
            title="ออกจากระบบ / กลับหน้าลงทะเบียน"
            className="p-2.5 rounded-xl bg-[#18181f] border border-neutral-800 hover:border-red-500/50 hover:text-red-400 text-neutral-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-[#18181f] border border-[#FEE101]/30 text-amber-200 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#FEE101]/20 bg-[#141418] px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#FEE101] text-neutral-950 font-semibold'
                    : 'text-neutral-300 hover:bg-neutral-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-neutral-950' : 'text-[#FEE101]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
};
