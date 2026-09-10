import React, { useState, useMemo } from 'react';
import { ClassScheduleItem, StudentProfile } from '../types';
import { canManageHouseContent } from '../utils/permissions';
import { 
  CalendarDays, 
  GraduationCap, 
  Clock, 
  Search, 
  MapPin, 
  BookOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  Sparkles, 
  ShieldCheck, 
  User, 
  ChevronLeft, 
  ChevronRight,
  LayoutGrid,
  Calendar as CalendarIcon,
  ListFilter,
  X,
  CheckCircle2,
  CalendarCheck2
} from 'lucide-react';

interface ClassScheduleTabProps {
  scheduleData: ClassScheduleItem[];
  userProfile?: StudentProfile;
  onUpdateSchedule?: (newSchedule: ClassScheduleItem[]) => void;
}

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const THAI_DAYS_LONG = [
  'อาทิตย์',
  'จันทร์',
  'อังคาร',
  'พุธ',
  'พฤหัสบดี',
  'ศุกร์',
  'เสาร์',
];

const THAI_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

// Helper to format date string YYYY-MM-DD
const formatDateString = (year: number, month: number, day: number) => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

export const ClassScheduleTab: React.FC<ClassScheduleTabProps> = ({
  scheduleData,
  userProfile,
  onUpdateSchedule,
}) => {
  // Current calendar navigation date (Default to September 2026 as simulated in environment)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 8 = September (0-indexed)
  const [selectedDateString, setSelectedDateString] = useState<string>('2026-09-10'); // Today!

  // Filters & View
  const [selectedYearFilter, setSelectedYearFilter] = useState<number | 'all'>(userProfile?.year || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarViewMode, setCalendarViewMode] = useState<'monthly' | 'weekly' | 'agenda'>('monthly');

  // RBAC Permission
  const hasManagementPermission = canManageHouseContent(userProfile);

  // Modal for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClassScheduleItem | null>(null);

  // Form states
  const [formDate, setFormDate] = useState('2026-09-10');
  const [formSubject, setFormSubject] = useState('');
  const [formDay, setFormDay] = useState<ClassScheduleItem['day']>('พฤหัสบดี');
  const [formYear, setFormYear] = useState<number>(1);
  const [formTimeIrl, setFormTimeIrl] = useState('19:00 - 20:00 น.');
  const [formTimeRp, setFormTimeRp] = useState('09:00 - 10:30 น.');
  const [formProfessor, setFormProfessor] = useState('ศ. โพโมนา สเปราต์');
  const [formClassroom, setFormClassroom] = useState('เรือนกระจกหมายเลข 1');
  const [formRequiredEquip, setFormRequiredEquip] = useState('ถุงมือหนังมังกร, หม้อกระถางดินเผา');

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(8); // September
    setSelectedDateString('2026-09-10');
  };

  // Days in current month and days in previous month
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Calendar cells generation
  const calendarDays = useMemo(() => {
    const days = [];

    // 1. Previous month filler days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYearNum = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = formatDateString(prevYearNum, prevMonthIdx, dayNum);
      const dayOfWeekIdx = (firstDayOfWeek - 1 - i + 7) % 7;
      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        dayOfWeek: THAI_DAYS_LONG[dayOfWeekIdx] as ClassScheduleItem['day'],
      });
    }

    // 2. Current month days
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const dateStr = formatDateString(currentYear, currentMonth, dayNum);
      const dayOfWeekIdx = new Date(currentYear, currentMonth, dayNum).getDay();
      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: true,
        dayOfWeek: THAI_DAYS_LONG[dayOfWeekIdx] as ClassScheduleItem['day'],
      });
    }

    // 3. Next month filler days (fill up grid to multiples of 7)
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYearNum = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = formatDateString(nextYearNum, nextMonthIdx, dayNum);
      const dayOfWeekIdx = new Date(nextYearNum, nextMonthIdx, dayNum).getDay();
      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        dayOfWeek: THAI_DAYS_LONG[dayOfWeekIdx] as ClassScheduleItem['day'],
      });
    }

    return days;
  }, [currentYear, currentMonth, daysInCurrentMonth, firstDayOfWeek, daysInPrevMonth]);

  // Helper to find classes for a given day
  const getClassesForDate = (dateStr: string, dayOfWeekName: string) => {
    return scheduleData.filter((item) => {
      // If item has specific date, match exact date
      if (item.date) {
        if (item.date !== dateStr) return false;
      } else {
        // Fallback to day of week match
        if (item.day !== dayOfWeekName) return false;
      }

      // Apply Year filter
      if (selectedYearFilter !== 'all' && item.year !== selectedYearFilter) {
        return false;
      }

      // Apply Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.subject.toLowerCase().includes(q) ||
          item.professor.toLowerCase().includes(q) ||
          item.classroom.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  };

  // Selected date's full info
  const selectedDateObj = useMemo(() => {
    const parts = selectedDateString.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dateInstance = new Date(y, m, d);
      return {
        year: y,
        yearBe: y + 543,
        month: m,
        monthName: THAI_MONTHS[m],
        day: d,
        dayOfWeek: THAI_DAYS_LONG[dateInstance.getDay()],
      };
    }
    return {
      year: 2026,
      yearBe: 2569,
      month: 8,
      monthName: 'กันยายน',
      day: 10,
      dayOfWeek: 'พฤหัสบดี',
    };
  }, [selectedDateString]);

  // Classes for the currently selected date
  const selectedDateClasses = useMemo(() => {
    return getClassesForDate(selectedDateString, selectedDateObj.dayOfWeek);
  }, [scheduleData, selectedDateString, selectedDateObj, selectedYearFilter, searchQuery]);

  // Open Create Modal
  const openCreateModal = (specificDate?: string, specificDay?: ClassScheduleItem['day']) => {
    setEditingItem(null);
    const dateToUse = specificDate || selectedDateString || '2026-09-10';
    setFormDate(dateToUse);
    if (specificDay) {
      setFormDay(specificDay);
    } else {
      const d = new Date(dateToUse);
      setFormDay(THAI_DAYS_LONG[d.getDay()] as ClassScheduleItem['day']);
    }
    setFormSubject('');
    setFormYear(typeof selectedYearFilter === 'number' ? selectedYearFilter : 1);
    setFormTimeIrl('19:00 - 20:00 น.');
    setFormTimeRp('09:00 - 10:30 น.');
    setFormProfessor('ศ. โพโมนา สเปราต์');
    setFormClassroom('เรือนกระจกหมายเลข 1');
    setFormRequiredEquip('ไม้กายสิทธิ์, ถุงมือหนังมังกร');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: ClassScheduleItem) => {
    setEditingItem(item);
    setFormDate(item.date || selectedDateString || '2026-09-10');
    setFormSubject(item.subject);
    setFormDay(item.day);
    setFormYear(item.year);
    setFormTimeIrl(item.timeIrl);
    setFormTimeRp(item.timeRp);
    setFormProfessor(item.professor);
    setFormClassroom(item.classroom);
    setFormRequiredEquip(item.requiredEquip);
    setIsModalOpen(true);
  };

  // Save Modal
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim()) return;

    if (editingItem) {
      const updatedList = scheduleData.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              subject: formSubject,
              date: formDate,
              day: formDay,
              year: formYear,
              timeIrl: formTimeIrl,
              timeRp: formTimeRp,
              professor: formProfessor,
              classroom: formClassroom,
              requiredEquip: formRequiredEquip,
            }
          : item
      );
      if (onUpdateSchedule) onUpdateSchedule(updatedList);
    } else {
      const newItem: ClassScheduleItem = {
        id: `sch-${Date.now()}`,
        subject: formSubject,
        date: formDate,
        day: formDay,
        year: formYear,
        timeIrl: formTimeIrl,
        timeRp: formTimeRp,
        professor: formProfessor,
        classroom: formClassroom,
        requiredEquip: formRequiredEquip,
      };
      if (onUpdateSchedule) onUpdateSchedule([...scheduleData, newItem]);
    }

    setIsModalOpen(false);
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคาบเรียนนี้ออกจากตาราง?')) {
      const updated = scheduleData.filter((item) => item.id !== id);
      if (onUpdateSchedule) onUpdateSchedule(updated);
    }
  };

  const getYearBadgeColor = (year: number) => {
    switch (year) {
      case 1:
        return 'bg-amber-950/80 text-[#FEE101] border-[#FEE101]/40';
      case 2:
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40';
      case 3:
        return 'bg-cyan-950/80 text-cyan-400 border-cyan-500/40';
      case 4:
        return 'bg-blue-950/80 text-blue-400 border-blue-500/40';
      case 5:
        return 'bg-purple-950/80 text-purple-400 border-purple-500/40';
      case 6:
        return 'bg-rose-950/80 text-rose-400 border-rose-500/40';
      case 7:
        return 'bg-red-950/80 text-red-400 border-red-500/40';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Controls */}
      <div className="bg-[#141418] border border-[#FEE101]/25 rounded-3xl p-6 sm:p-7 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-[#FEE101]/30 text-xs font-semibold text-[#FEE101] mb-2">
              <CalendarCheck2 className="w-3.5 h-3.5" />
              <span>ระบบปฏิทินตารางเรียนประจำบ้านฮัฟเฟิลพัฟ (Hogwarts Academic Calendar)</span>
            </div>
            <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-amber-100 flex items-center gap-3">
              <span>ปฏิทินตารางเรียนฮอกวอตส์ (วันที่ / เดือน / ปี)</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              แสดงวันที่และตารางเรียนวิชาเวทมนตร์ทั้ง 7 ชั้นปี สามารถกดดูรายละเอียดแต่ละวัน หรือเพิ่ม/แก้ไขคาบเรียนได้
            </p>
            {hasManagementPermission && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-[#FEE101]/40 text-xs text-amber-200">
                <ShieldCheck className="w-4 h-4 text-[#FEE101] flex-shrink-0" />
                <span>
                  <strong>โหมดผู้ดูแลระบบ (Admin Mode):</strong> คุณมีสิทธิ์ในการ <strong>เพิ่ม ลบ หรือแก้ไข</strong> ปฏิทินและตารางเรียนทั้งหมด
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {hasManagementPermission && (
              <button
                onClick={() => openCreateModal()}
                className="px-4 py-2.5 rounded-xl bg-[#FEE101] hover:bg-[#ffe83d] text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#FEE101]/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มคาบเรียนใหม่</span>
              </button>
            )}

            {/* View Switchers */}
            <div className="flex items-center gap-1 bg-[#0e0e12] p-1 rounded-xl border border-neutral-800">
              <button
                onClick={() => setCalendarViewMode('monthly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  calendarViewMode === 'monthly'
                    ? 'bg-[#FEE101] text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="มุมมองปฏิทินรายเดือน (วันที่/เดือน/ปี)"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>ปฏิทินรายเดือน</span>
              </button>

              <button
                onClick={() => setCalendarViewMode('weekly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  calendarViewMode === 'weekly'
                    ? 'bg-[#FEE101] text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="มุมมองปฏิทินรายสัปดาห์"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>รายสัปดาห์</span>
              </button>

              <button
                onClick={() => setCalendarViewMode('agenda')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  calendarViewMode === 'agenda'
                    ? 'bg-[#FEE101] text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="มุมมองระเบียบวาระ (Agenda)"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>ระเบียบวาระ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter bar: Year selection & Search query */}
        <div className="mt-5 pt-5 border-t border-neutral-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Year selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs text-neutral-400 mr-1 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#FEE101]" />
              <span>ชั้นปี:</span>
            </span>
            <button
              onClick={() => setSelectedYearFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedYearFilter === 'all'
                  ? 'bg-[#FEE101] text-neutral-950'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              ทุกชั้นปี (1-7)
            </button>
            {[1, 2, 3, 4, 5, 6, 7].map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYearFilter(yr)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedYearFilter === yr
                    ? 'bg-[#FEE101] text-neutral-950 font-bold'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                ปี {yr}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาวิชา, ศาสตราจารย์, ห้องเรียน..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0e0e12] border border-neutral-800 focus:border-[#FEE101] text-xs text-amber-50 outline-none placeholder:text-neutral-600 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* MONTHLY CALENDAR VIEW (วันที่ / เดือน / ปี) */}
      {calendarViewMode === 'monthly' && (
        <div className="space-y-6">
          {/* Month/Year Navigation Bar */}
          <div className="bg-[#141418] border border-[#FEE101]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            {/* Left: Previous, Next, and Month/Year Display */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-[#FEE101] transition-colors cursor-pointer"
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-[#FEE101] transition-colors cursor-pointer"
                  title="เดือนถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Month / Year Headline */}
              <div className="text-center sm:text-left">
                <h3 className="font-cinzel text-lg sm:text-xl font-bold text-amber-50 flex items-center gap-2">
                  <span>{THAI_MONTHS[currentMonth]}</span>
                  <span className="text-[#FEE101]">{currentYear}</span>
                  <span className="text-xs font-mono text-neutral-500 font-normal">
                    (พ.ศ. {currentYear + 543})
                  </span>
                </h3>
              </div>
            </div>

            {/* Right: Quick Month/Year Dropdowns and "Today" button */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
                className="bg-[#0e0e12] border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-amber-200 outline-none focus:border-[#FEE101] cursor-pointer"
              >
                {THAI_MONTHS.map((mName, idx) => (
                  <option key={idx} value={idx}>
                    {mName}
                  </option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                className="bg-[#0e0e12] border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-amber-200 outline-none focus:border-[#FEE101] cursor-pointer"
              >
                {[2025, 2026, 2027, 2028].map((yr) => (
                  <option key={yr} value={yr}>
                    ค.ศ. {yr} (พ.ศ. {yr + 543})
                  </option>
                ))}
              </select>

              <button
                onClick={handleJumpToToday}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-[#FEE101]/40 text-[#FEE101] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                วันนี้ (10 ก.ย.)
              </button>
            </div>
          </div>

          {/* 7-Columns Calendar Grid (อาทิตย์ - เสาร์) */}
          <div className="bg-[#141418] border border-neutral-800 rounded-3xl p-3 sm:p-5 shadow-xl overflow-x-auto">
            <div className="min-w-[720px]">
              {/* Day-of-week header row */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {THAI_DAYS_LONG.map((dayName, idx) => {
                  const isWeekend = idx === 0 || idx === 6;
                  return (
                    <div
                      key={dayName}
                      className={`text-center py-2.5 rounded-xl font-cinzel text-xs font-bold border ${
                        isWeekend
                          ? 'bg-[#181820] text-amber-300 border-amber-500/20'
                          : 'bg-[#101014] text-neutral-300 border-neutral-800/80'
                      }`}
                    >
                      <span className="hidden sm:inline">{dayName}</span>
                      <span className="sm:hidden">{THAI_DAYS_SHORT[idx]}</span>
                    </div>
                  );
                })}
              </div>

              {/* Day cells grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((cell, idx) => {
                  const dayClasses = getClassesForDate(cell.dateStr, cell.dayOfWeek);
                  const isSelected = selectedDateString === cell.dateStr;
                  const isToday = cell.dateStr === '2026-09-10';

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDateString(cell.dateStr)}
                      className={`min-h-[115px] sm:min-h-[135px] p-2 sm:p-2.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group relative ${
                        isSelected
                          ? 'bg-[#1c1c24] border-[#FEE101] shadow-[0_0_20px_rgba(254,225,1,0.15)] ring-1 ring-[#FEE101]'
                          : cell.isCurrentMonth
                          ? 'bg-[#101014] border-neutral-800/90 hover:border-[#FEE101]/40 hover:bg-[#15151c]'
                          : 'bg-[#0a0a0d]/70 border-neutral-900 text-neutral-600 opacity-60'
                      }`}
                    >
                      {/* Cell Top: Day number + Today Tag */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`text-xs sm:text-sm font-bold font-mono px-2 py-0.5 rounded-lg ${
                            isToday
                              ? 'bg-[#FEE101] text-neutral-950 shadow-sm font-extrabold'
                              : isSelected
                              ? 'bg-amber-950 text-[#FEE101] border border-[#FEE101]/40'
                              : cell.isCurrentMonth
                              ? 'text-neutral-200'
                              : 'text-neutral-600'
                          }`}
                        >
                          {cell.dayNum}
                        </span>

                        <div className="flex items-center gap-1">
                          {isToday && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-[#FEE101] border border-[#FEE101]/30">
                              วันนี้
                            </span>
                          )}

                          {hasManagementPermission && cell.isCurrentMonth && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCreateModal(cell.dateStr, cell.dayOfWeek);
                              }}
                              className="w-5 h-5 rounded-md bg-neutral-800 hover:bg-[#FEE101] text-neutral-400 hover:text-neutral-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title={`เพิ่มคาบเรียนในวันที่ ${cell.dayNum}`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Cell Middle: Classes List */}
                      <div className="space-y-1 my-1 flex-1 overflow-hidden">
                        {dayClasses.slice(0, 2).map((cls) => (
                          <div
                            key={cls.id}
                            className={`p-1 sm:p-1.5 rounded-lg text-[10px] border leading-tight truncate transition-all ${getYearBadgeColor(
                              cls.year
                            )}`}
                            title={`${cls.subject} (${cls.timeIrl}) โดย ${cls.professor}`}
                          >
                            <div className="font-semibold truncate">{cls.subject}</div>
                            <div className="text-[9px] opacity-80 flex items-center gap-1 mt-0.5 truncate">
                              <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate">{cls.timeIrl}</span>
                            </div>
                          </div>
                        ))}

                        {dayClasses.length > 2 && (
                          <div className="text-[9px] text-amber-300/80 font-medium px-1 text-center bg-neutral-900/80 rounded py-0.5 border border-neutral-800">
                            +{dayClasses.length - 2} คาบเพิ่มเติม
                          </div>
                        )}
                      </div>

                      {/* Cell Bottom: Class count dot */}
                      {dayClasses.length > 0 && (
                        <div className="flex items-center justify-end">
                          <span className="text-[10px] font-mono text-neutral-400">
                            {dayClasses.length} คาบ
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Date Detail Drawer / Panel */}
          <div className="bg-[#141418] border-2 border-[#FEE101]/40 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FEE101]/10 border border-[#FEE101]/30 flex items-center justify-center text-[#FEE101]">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                    <span>ตารางเรียนเฉพาะวันที่</span>
                    {selectedDateString === '2026-09-10' && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#FEE101] text-neutral-950">
                        วันนี้ (TODAY)
                      </span>
                    )}
                  </div>
                  <h3 className="font-cinzel text-lg sm:text-xl font-bold text-amber-100">
                    วัน{selectedDateObj.dayOfWeek} ที่ {selectedDateObj.day} {selectedDateObj.monthName} {selectedDateObj.year} (พ.ศ. {selectedDateObj.yearBe})
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-amber-300">
                  มี {selectedDateClasses.length} คาบเรียน
                </span>

                {hasManagementPermission && (
                  <button
                    onClick={() => openCreateModal(selectedDateString, selectedDateObj.dayOfWeek as ClassScheduleItem['day'])}
                    className="px-3.5 py-1.5 rounded-xl bg-[#FEE101] hover:bg-[#ffe83d] text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ เพิ่มคาบในวันนี้</span>
                  </button>
                )}
              </div>
            </div>

            {/* Classes for this date */}
            {selectedDateClasses.length === 0 ? (
              <div className="py-12 text-center bg-[#0e0e12] rounded-2xl border border-neutral-800/80">
                <CalendarDays className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                <p className="text-sm text-neutral-400 font-medium">
                  ไม่มีคาบเรียนที่กำหนดในวันที่ {selectedDateObj.day} {selectedDateObj.monthName} {selectedDateObj.year}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  คลิกที่วันที่อื่นในปฏิทินเพื่อดูตารางเรียน หรือกดปุ่มด้านล่างเพื่อเพิ่มวิชาเรียน
                </p>
                {hasManagementPermission && (
                  <button
                    onClick={() => openCreateModal(selectedDateString, selectedDateObj.dayOfWeek as ClassScheduleItem['day'])}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#FEE101] text-neutral-950 text-xs font-bold hover:bg-[#ffe83d] transition-colors cursor-pointer"
                  >
                    + เพิ่มคาบเรียนในวันที่ {selectedDateObj.day} {selectedDateObj.monthName}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedDateClasses.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-[#101014] border border-neutral-800 hover:border-[#FEE101]/50 transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      {/* Card Top: Year badge & Actions */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getYearBadgeColor(
                            item.year
                          )}`}
                        >
                          ชั้นปีที่ {item.year}
                        </span>

                        {hasManagementPermission && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-[#FEE101] transition-colors cursor-pointer"
                              title="แก้ไขคาบเรียน"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-rose-950/80 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="ลบคาบเรียน"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Subject Name */}
                      <h4 className="font-semibold text-base text-amber-50 group-hover:text-[#FEE101] transition-colors mb-2">
                        {item.subject}
                      </h4>

                      {/* Time Details */}
                      <div className="space-y-1.5 text-xs text-neutral-300 bg-[#0c0c0f] p-3 rounded-xl border border-neutral-800/80 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">เวลาในชีวิตจริง (IRL):</span>
                          <strong className="text-amber-300 font-mono">{item.timeIrl}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">เวลาในเกม (FiveM RP):</span>
                          <strong className="text-emerald-400 font-mono">{item.timeRp}</strong>
                        </div>
                      </div>

                      {/* Professor & Classroom */}
                      <div className="space-y-1 text-xs text-neutral-400 mb-3">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#FEE101]" />
                          <span>ผู้สอน: {item.professor}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>สถานที่: {item.classroom}</span>
                        </div>
                      </div>
                    </div>

                    {/* Equipment */}
                    <div className="pt-3 border-t border-neutral-800/80 text-[11px] text-neutral-400">
                      <span className="text-amber-200/80 font-medium">อุปกรณ์: </span>
                      <span>{item.requiredEquip}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WEEKLY CALENDAR VIEW */}
      {calendarViewMode === 'weekly' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {THAI_DAYS_LONG.map((dayName) => {
            const dayClasses = scheduleData.filter((item) => {
              if (item.day !== dayName) return false;
              if (selectedYearFilter !== 'all' && item.year !== selectedYearFilter) return false;
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return (
                  item.subject.toLowerCase().includes(q) ||
                  item.professor.toLowerCase().includes(q) ||
                  item.classroom.toLowerCase().includes(q)
                );
              }
              return true;
            });

            return (
              <div
                key={dayName}
                className="bg-[#141418] border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5 mb-3">
                    <h3 className="font-cinzel text-base font-bold text-amber-100 flex items-center gap-2">
                      <span>วัน{dayName}</span>
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-amber-300">
                      {dayClasses.length} คาบ
                    </span>
                  </div>

                  <div className="space-y-3">
                    {dayClasses.length === 0 ? (
                      <p className="text-xs text-neutral-600 italic py-4 text-center">ไม่มีคาบเรียน</p>
                    ) : (
                      dayClasses.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-[#0f0f13] border border-neutral-800/80 hover:border-[#FEE101]/40 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getYearBadgeColor(item.year)}`}>
                              ปี {item.year}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {item.date && (
                                <span className="text-[10px] font-mono text-neutral-400">
                                  {item.date}
                                </span>
                              )}
                              {hasManagementPermission && (
                                <div className="flex items-center gap-0.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditModal(item);
                                    }}
                                    className="p-1 rounded bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-[#FEE101] transition-colors cursor-pointer"
                                    title="แก้ไขคาบเรียน"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteItem(item.id);
                                    }}
                                    className="p-1 rounded bg-neutral-800/80 hover:bg-rose-950 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                                    title="ลบคาบเรียน"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <h4 className="font-semibold text-xs text-amber-50 mb-1">{item.subject}</h4>
                          <p className="text-[11px] text-amber-300/90 font-mono">{item.timeIrl}</p>
                          <p className="text-[10px] text-neutral-400 mt-1">ผู้สอน: {item.professor}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {hasManagementPermission && (
                  <button
                    onClick={() => openCreateModal(undefined, dayName as ClassScheduleItem['day'])}
                    className="w-full mt-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-[#FEE101] text-neutral-400 hover:text-neutral-950 font-semibold text-xs transition-colors cursor-pointer border border-neutral-800"
                  >
                    + เพิ่มคาบวัน{dayName}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AGENDA LIST VIEW */}
      {calendarViewMode === 'agenda' && (
        <div className="bg-[#141418] border border-neutral-800 rounded-3xl p-6">
          <div className="space-y-4">
            {scheduleData
              .filter((item) => {
                if (selectedYearFilter !== 'all' && item.year !== selectedYearFilter) return false;
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase();
                  return (
                    item.subject.toLowerCase().includes(q) ||
                    item.professor.toLowerCase().includes(q) ||
                    item.classroom.toLowerCase().includes(q)
                  );
                }
                return true;
              })
              .map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#0f0f13] border border-neutral-800 hover:border-[#FEE101]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-[#FEE101]/30 flex items-center justify-center text-[#FEE101] flex-shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getYearBadgeColor(item.year)}`}>
                          ปี {item.year}
                        </span>
                        <span className="text-xs font-semibold text-amber-200">
                          วัน{item.day} {item.date && `(${item.date})`}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-amber-50">{item.subject}</h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        ผู้สอน: {item.professor} • สถานที่: {item.classroom}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4">
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-amber-300">IRL: {item.timeIrl}</p>
                      <p className="text-[11px] font-mono text-emerald-400">RP: {item.timeRp}</p>
                    </div>

                    {hasManagementPermission && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-[#FEE101] transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 rounded-lg bg-neutral-900 hover:bg-rose-950/80 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Class Schedule */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#16161d] border-2 border-[#FEE101] rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-[0_0_50px_rgba(254,225,1,0.25)] text-left relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-5">
              <div className="flex items-center gap-2">
                <CalendarCheck2 className="w-5 h-5 text-[#FEE101]" />
                <h3 className="font-cinzel text-lg font-bold text-amber-100">
                  {editingItem ? 'แก้ไขข้อมูลคาบเรียน' : 'เพิ่มคาบเรียนใหม่ลงในปฏิทิน'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Date Input (วันที่ / เดือน / ปี) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">
                    วันที่จัดสอน (วันที่ / เดือน / ปี)
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => {
                      setFormDate(e.target.value);
                      const d = new Date(e.target.value);
                      if (!isNaN(d.getTime())) {
                        setFormDay(THAI_DAYS_LONG[d.getDay()] as ClassScheduleItem['day']);
                      }
                    }}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#0f0f13] border border-neutral-700 text-xs text-amber-50 focus:border-[#FEE101] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">
                    วันในสัปดาห์
                  </label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as ClassScheduleItem['day'])}
                    className="w-full px-3 py-2 rounded-xl bg-[#0f0f13] border border-neutral-700 text-xs text-amber-50 focus:border-[#FEE101] outline-none"
                  >
                    {THAI_DAYS_LONG.map((d) => (
                      <option key={d} value={d}>
                        วัน{d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-amber-200 mb-1">
                    ชื่อวิชาเรียน
                  </label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    required
                    placeholder="เช่น วิชาสมุนไพรศาสตร์ (Herbology 101)"
                    className="w-full px-3 py-2 rounded-xl bg-[#0f0f13] border border-neutral-700 text-xs text-amber-50 focus:border-[#FEE101] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">
                    ระดับชั้นปี
                  </label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-[#0f0f13] border border-neutral-700 text-xs text-amber-50 focus:border-[#FEE101] outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((y) => (
                      <option key={y} value={y}>
                        ปี {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">
                    เวลาในชีวิตจริง (IRL)
                  </label>
                  <input
                    type="text"
                    value={formTimeIrl}
                    onChange={(e) => setFormTimeIrl(e.target.value)}
                    required
                    placeholder="เช่น 19:00 - 20:00 น."
                    className="w-full px-3 py-2 rounded-xl bg-[#0f0f13] border border-neutral-700 text-xs text-amber-50 focus:border-[#FEE101] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">
                    เวลาในเซิร์ฟเวอร์ (FiveM RP)
                  </label>
                  <input
                    type="text"
                    value={formTimeRp}
                    onChange={(e) => setFormTimeRp(e.target.value)}
                    required
                    placeholder="เช่น 09:00 - 10:30 น."
                    className="w-full px-3 py-2 rounded-xl bg-[#0f0f13] border border-neutral-700 text-xs text-amber-50 focus:border-[#FEE101] outline-none"
                  />
                </div>
              </div>

              {/* Professor & Classroom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">
                    ศาสตราจารย์ผู้สอน
                  </label>
                  <input
                    type="text"
                    value={formProfessor}
                    onChange={(e) => setFormProfessor(e.target.value)}
                    required
                    placeholder="เช่น ศ. โพโมนา สเปราต์"
                    className="w-full px-3 py-2 rounded-xl bg-[#0f0f13] border border-neutral-700 text-xs text-amber-50 focus:border-[#FEE101] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-200 mb-1">
                    สถานที่ / ห้องเรียน
                  </label>
                  <input
                    type="text"
                    value={formClassroom}
                    onChange={(e) => setFormClassroom(e.target.value)}
                    required
                    placeholder="เช่น เรือนกระจกหมายเลข 1"
                    className="w-full px-3 py-2 rounded-xl bg-[#0f0f13] border border-neutral-700 text-xs text-amber-50 focus:border-[#FEE101] outline-none"
                  />
                </div>
              </div>

              {/* Required Equipment */}
              <div>
                <label className="block text-xs font-semibold text-amber-200 mb-1">
                  อุปกรณ์ที่ต้องเตรียม
                </label>
                <input
                  type="text"
                  value={formRequiredEquip}
                  onChange={(e) => setFormRequiredEquip(e.target.value)}
                  placeholder="เช่น ไม้กายสิทธิ์, ถุงมือหนังมังกร, หม้อกระถางดินเผา"
                  className="w-full px-3 py-2 rounded-xl bg-[#0f0f13] border border-neutral-700 text-xs text-amber-50 focus:border-[#FEE101] outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FEE101] hover:bg-[#ffe83d] text-neutral-950 font-bold text-xs shadow-md shadow-[#FEE101]/20 cursor-pointer"
                >
                  {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มคาบเรียนลงปฏิทิน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
