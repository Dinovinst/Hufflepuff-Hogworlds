import React, { useState } from 'react';
import { 
  AppView, 
  HouseAnnouncement, 
  HouseEvent, 
  StudentProfile 
} from '../types';
import { canManageHouseContent } from '../utils/permissions';
import { 
  Megaphone, 
  Calendar, 
  Pin, 
  Clock, 
  MapPin, 
  Plus, 
  Sparkles, 
  ChevronRight, 
  ArrowUpRight, 
  CalendarDays, 
  Wand2, 
  Package, 
  Users, 
  Check, 
  Bell, 
  ShieldCheck,
  Edit2,
  Trash2,
  AlertCircle,
  X
} from 'lucide-react';

interface HouseDashboardViewProps {
  userProfile: StudentProfile;
  announcements: HouseAnnouncement[];
  events: HouseEvent[];
  onNavigate: (view: AppView) => void;
  onUpdateAnnouncements?: (announcements: HouseAnnouncement[]) => void;
  onUpdateEvents?: (events: HouseEvent[]) => void;
}

export const HouseDashboardView: React.FC<HouseDashboardViewProps> = ({
  userProfile,
  announcements,
  events,
  onNavigate,
  onUpdateAnnouncements,
  onUpdateEvents,
}) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<HouseAnnouncement | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pinned'>('all');
  const [joinedEvents, setJoinedEvents] = useState<{ [id: string]: boolean }>({
    'ev-1': true,
  });

  // Modal for Create/Edit Announcement
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<HouseAnnouncement | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<HouseAnnouncement['category']>('ข่าวสารสำคัญ');
  const [formPinned, setFormPinned] = useState(false);

  // Modal for Create/Edit Event
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<HouseEvent | null>(null);
  const [formEventTitle, setFormEventTitle] = useState('');
  const [formEventDateLabel, setFormEventDateLabel] = useState('');
  const [formEventTimeIrl, setFormEventTimeIrl] = useState('');
  const [formEventTimeRp, setFormEventTimeRp] = useState('');
  const [formEventLocation, setFormEventLocation] = useState('');
  const [formEventCategory, setFormEventCategory] = useState<HouseEvent['category']>('meeting');

  // Check RBAC permission
  const hasManagementPermission = canManageHouseContent(userProfile);

  const toggleEventJoin = (id: string) => {
    setJoinedEvents((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const openCreateEventModal = () => {
    setEditingEvent(null);
    setFormEventTitle('');
    setFormEventDateLabel('12 ก.ย. (เสาร์)');
    setFormEventTimeIrl('20:00 - 21:30 น.');
    setFormEventTimeRp('14:00 - 15:30 น.');
    setFormEventLocation('ห้องนั่งเล่นรวมฮัฟเฟิลพัฟ');
    setFormEventCategory('meeting');
    setIsEventModalOpen(true);
  };

  const openEditEventModal = (ev: HouseEvent) => {
    setEditingEvent(ev);
    setFormEventTitle(ev.title);
    setFormEventDateLabel(ev.dateLabel);
    setFormEventTimeIrl(ev.timeIrl);
    setFormEventTimeRp(ev.timeRp);
    setFormEventLocation(ev.location);
    setFormEventCategory(ev.category);
    setIsEventModalOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบกิจกรรม "${target?.title || ''}"?`)) return;
    const updated = events.filter((e) => e.id !== eventId);
    if (onUpdateEvents) {
      onUpdateEvents(updated);
    }
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEventTitle.trim()) return;

    if (editingEvent) {
      const updated = events.map((ev) =>
        ev.id === editingEvent.id
          ? {
              ...ev,
              title: formEventTitle.trim(),
              dateLabel: formEventDateLabel.trim(),
              timeIrl: formEventTimeIrl.trim(),
              timeRp: formEventTimeRp.trim(),
              location: formEventLocation.trim(),
              category: formEventCategory,
            }
          : ev
      );
      if (onUpdateEvents) onUpdateEvents(updated);
    } else {
      const newEvent: HouseEvent = {
        id: `ev-${Date.now()}`,
        title: formEventTitle.trim(),
        dateLabel: formEventDateLabel.trim(),
        timeIrl: formEventTimeIrl.trim(),
        timeRp: formEventTimeRp.trim(),
        location: formEventLocation.trim(),
        category: formEventCategory,
      };
      if (onUpdateEvents) onUpdateEvents([newEvent, ...events]);
    }
    setIsEventModalOpen(false);
  };

  const openCreateModal = () => {
    setEditingAnnouncement(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('ข่าวสารสำคัญ');
    setFormPinned(false);
    setIsModalOpen(true);
  };

  const openEditModal = (ann: HouseAnnouncement, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAnnouncement(ann);
    setFormTitle(ann.title);
    setFormContent(ann.content);
    setFormCategory(ann.category);
    setFormPinned(!!ann.pinned);
    setIsModalOpen(true);
  };

  const handleDeleteAnnouncement = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('คุณต้องการลบประกาศนี้ใช่หรือไม่?')) {
      const updated = announcements.filter(a => a.id !== id);
      if (onUpdateAnnouncements) {
        onUpdateAnnouncements(updated);
      }
    }
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert('กรุณากรอกหัวข้อและเนื้อหาประกาศ');
      return;
    }

    if (editingAnnouncement) {
      // Update existing
      const updated = announcements.map((item) => {
        if (item.id === editingAnnouncement.id) {
          return {
            ...item,
            title: formTitle.trim(),
            content: formContent.trim(),
            category: formCategory,
            pinned: formPinned,
          };
        }
        return item;
      });
      if (onUpdateAnnouncements) {
        onUpdateAnnouncements(updated);
      }
    } else {
      // Create new
      const newAnn: HouseAnnouncement = {
        id: `ann-${Date.now()}`,
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
        author: userProfile.name,
        role: userProfile.houseRoles?.join(', ') || userProfile.houseRole,
        date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
        pinned: formPinned,
      };
      if (onUpdateAnnouncements) {
        onUpdateAnnouncements([newAnn, ...announcements]);
      }
    }

    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#171610] via-[#1c1b14] to-[#121216] border border-[#FEE101]/30 p-6 sm:p-8 mb-8 shadow-xl shadow-black/50">
        <div className="absolute right-0 top-0 w-96 h-full bg-[radial-gradient(ellipse_at_top_right,#FEE10125,transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-[#FEE101]/30 text-xs font-semibold text-[#FEE101] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ห้องนั่งเล่นรวมบ้านฮัฟเฟิลพัฟ • Hogworlds Wizardry Project</span>
            </div>
            <h1 className="font-cinzel text-2xl sm:text-4xl font-extrabold text-amber-100">
              สวัสดี, {userProfile.name}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-2xl leading-relaxed">
              ตำแหน่งในบ้าน: <span className="text-[#FEE101] font-semibold">{userProfile.houseRoles ? userProfile.houseRoles.join(', ') : userProfile.houseRole} 🟡</span> | 
              ชั้นปีที่ {userProfile.year} | รหัสนักศึกษา {userProfile.studentId}
            </p>

            {/* Role Privilege Status Badge */}
            {hasManagementPermission && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-[#FEE101]/40 text-xs text-amber-200">
                <ShieldCheck className="w-4 h-4 text-[#FEE101]" />
                <span>
                  <strong>สิทธิ์การจัดการระดับสูง:</strong> คุณสามารถสร้าง แก้ไข และลบประกาศบ้านและตารางเรียนได้
                </span>
              </div>
            )}
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('schedule')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#FEE101] hover:bg-[#ffe83d] text-neutral-950 flex items-center gap-2 transition-all shadow-md shadow-[#FEE101]/25 cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-neutral-950" />
              <span>ดูปฏิทินตารางเรียน</span>
            </button>

            <button
              onClick={() => onNavigate('spells')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#1a1914] hover:bg-[#252319] border border-[#FEE101]/40 text-amber-300 hover:text-[#FEE101] flex items-center gap-2 transition-all cursor-pointer"
            >
              <Wand2 className="w-4 h-4" />
              <span>เช็คตำราคาถา</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Grid: Sidebar Navigation + Announcements & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-[#141418] border border-[#FEE101]/20 rounded-2xl p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-800">
              <Sparkles className="w-4 h-4 text-[#FEE101]" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-200">
                เมนูลัดภายในบ้าน
              </h2>
            </div>

            <nav className="space-y-1.5">
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-[#FEE101] text-neutral-950 shadow-md font-semibold cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4" />
                  <span>ภาพรวมห้องนั่งเล่น</span>
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('schedule')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-neutral-300 hover:text-amber-200 hover:bg-neutral-800/60 transition-colors group cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <CalendarDays className="w-4 h-4 text-[#FEE101]" />
                  <span>ปฏิทินตารางเรียน (Calendar)</span>
                </span>
                <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigate('spells')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-neutral-300 hover:text-amber-200 hover:bg-neutral-800/60 transition-colors group cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Wand2 className="w-4 h-4 text-[#FEE101]" />
                  <span>ตำราคาถา 68 บท & การครอบครอง</span>
                </span>
                <span className="text-[10px] bg-amber-950 px-1.5 py-0.5 rounded border border-[#FEE101]/30 text-amber-300">
                  68 คาถา
                </span>
              </button>

              <button
                onClick={() => onNavigate('members')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-neutral-300 hover:text-amber-200 hover:bg-neutral-800/60 transition-colors group cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#FEE101]" />
                  <span>ทำเนียบสมาชิก (แยกตามตำแหน่ง)</span>
                </span>
                <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>
            </nav>

            {/* House Notice */}
            <div className="mt-6 pt-4 border-t border-neutral-800">
              <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[#FEE101]" />
                <span>คำเตือนห้องนั่งเล่นรวม</span>
              </p>
              <p className="text-xs text-neutral-400 leading-relaxed">
                เคาะถังไม้แถวที่สองจากด้านล่างใบที่สองจากตรงกลางตามจังหวะ "เฮลกา ฮัฟเฟิลพัฟ" หากเคาะผิดจะพ่นน้ำส้มสายชูใส่ทันที!
              </p>
            </div>
          </div>
        </aside>

        {/* Core Content: Announcements & Events */}
        <div className="lg:col-span-9 space-y-8">
          {/* =========================================================================
              ส่วนที่ 1: ประกาศสำคัญประจำบ้าน (House Announcement Board) with RBAC
              ========================================================================= */}
          <section className="bg-[#141418] border border-[#FEE101]/25 rounded-3xl p-6 sm:p-7 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-[#FEE101]/40 flex items-center justify-center text-[#FEE101]">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-cinzel text-lg sm:text-xl font-bold text-amber-100">
                    ประกาศสำคัญประจำบ้าน (House Announcements)
                  </h2>
                  <p className="text-xs text-neutral-400">
                    ข่าวสาร คำสั่งการ และกิจกรรมจากฝ่ายบริหารบ้านฮัฟเฟิลพัฟ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Tag filters */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeFilter === 'all'
                        ? 'bg-[#FEE101] text-neutral-950 font-semibold'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    onClick={() => setActiveFilter('pinned')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeFilter === 'pinned'
                        ? 'bg-[#FEE101] text-neutral-950 font-semibold'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    ปักหมุดด่วน
                  </button>
                </div>

                {/* Management Add Announcement Button */}
                {hasManagementPermission && (
                  <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FEE101] hover:bg-[#ffe83d] text-neutral-950 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>สร้างประกาศใหม่</span>
                  </button>
                )}
              </div>
            </div>

            {/* Announcements List */}
            <div className="space-y-4">
              {announcements
                .filter((ann) => (activeFilter === 'pinned' ? ann.pinned : true))
                .map((ann) => (
                  <div
                    key={ann.id}
                    onClick={() => setSelectedAnnouncement(ann)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer group relative ${
                      ann.pinned
                        ? 'bg-gradient-to-r from-amber-950/30 to-[#18181f] border-[#FEE101]/40 hover:border-[#FEE101]'
                        : 'bg-[#18181e] border-neutral-800 hover:border-[#FEE101]/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {ann.pinned && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FEE101] text-neutral-950">
                            <Pin className="w-3 h-3" />
                            <span>ปักหมุด</span>
                          </span>
                        )}
                        <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-amber-200 border border-neutral-700">
                          {ann.category}
                        </span>
                        <span className="text-xs text-neutral-500">{ann.date}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Manager Edit / Delete controls */}
                        {hasManagementPermission && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => openEditModal(ann, e)}
                              title="แก้ไขประกาศ"
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-[#FEE101] transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteAnnouncement(ann.id, e)}
                              title="ลบประกาศ"
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950 text-neutral-300 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-[#FEE101] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>

                    <h3 className="text-base font-semibold text-amber-50 group-hover:text-[#FEE101] transition-colors mb-2">
                      {ann.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 leading-relaxed">
                      {ann.content}
                    </p>

                    <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                      <span>โดย: <strong className="text-amber-200">{ann.author}</strong> ({ann.role})</span>
                      <span className="text-[#FEE101] text-[11px] group-hover:underline">อ่านรายละเอียด →</span>
                    </div>
                  </div>
                ))}
            </div>
          </section>

          {/* =========================================================================
              ส่วนที่ 2: กิจกรรมและการนัดหมายประจำสัปดาห์ (Upcoming Events & Roleplay)
              ========================================================================= */}
          <section className="bg-[#141418] border border-[#FEE101]/25 rounded-3xl p-6 sm:p-7 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-[#FEE101]/40 flex items-center justify-center text-[#FEE101]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-cinzel text-lg sm:text-xl font-bold text-amber-100">
                    กำหนดการและกิจกรรมสัปดาห์นี้
                  </h2>
                  <p className="text-xs text-neutral-400">
                    ตารางนัดหมายรวมตัว ฝึกซ้อมควิดดิช และการประลองเวทมนตร์
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {hasManagementPermission && (
                  <button
                    onClick={openCreateEventModal}
                    className="px-3.5 py-1.5 rounded-xl bg-[#FEE101] hover:bg-[#ffe83d] text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#FEE101]/20 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ เพิ่มกิจกรรมใหม่</span>
                  </button>
                )}
                <button
                  onClick={() => onNavigate('schedule')}
                  className="text-xs text-amber-300 hover:text-[#FEE101] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>เปิดปฏิทินตารางเรียนฉบับเต็ม</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {events.map((ev) => {
                const isJoined = joinedEvents[ev.id];
                return (
                  <div
                    key={ev.id}
                    className="p-4 rounded-2xl bg-[#18181f] border border-neutral-800 hover:border-[#FEE101]/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Time badges & Admin Action buttons */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FEE101] bg-amber-950/60 px-2.5 py-1 rounded-lg border border-[#FEE101]/30">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{ev.timeIrl}</span>
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-neutral-400">
                            {ev.timeRp}
                          </span>
                          {hasManagementPermission && (
                            <div className="flex items-center gap-1 ml-1 border-l border-neutral-800 pl-1.5">
                              <button
                                onClick={() => openEditEventModal(ev)}
                                className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-[#FEE101] transition-colors cursor-pointer"
                                title="แก้ไขกิจกรรม"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(ev.id)}
                                className="p-1 rounded-lg bg-neutral-900 hover:bg-rose-950 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                                title="ลบกิจกรรม"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-medium text-amber-400/80 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                          {ev.dateLabel}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-amber-50 mb-1.5 line-clamp-2">
                        {ev.title}
                      </h3>

                      <p className="text-xs text-neutral-400 flex items-center gap-1.5 mb-4">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="line-clamp-1">{ev.location}</span>
                      </p>
                    </div>

                    {/* Join / RSVP Button */}
                    <button
                      onClick={() => toggleEventJoin(ev.id)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isJoined
                          ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                          : 'bg-[#22211b] hover:bg-[#FEE101] hover:text-neutral-950 border border-[#FEE101]/30 text-amber-200'
                      }`}
                    >
                      {isJoined ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>ลงชื่อเข้าร่วมแล้ว (RSVP)</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>กดเข้าร่วมกิจกรรม</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#16161c] border-2 border-[#FEE101]/60 rounded-2xl max-w-lg w-full p-6 shadow-[0_0_50px_rgba(254,225,1,0.2)] text-left relative">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded bg-neutral-800 text-amber-200 border border-neutral-700">
                  {selectedAnnouncement.category}
                </span>
                <span className="text-xs text-neutral-400">{selectedAnnouncement.date}</span>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-cinzel text-lg sm:text-xl font-bold text-[#FEE101] mb-3">
              {selectedAnnouncement.title}
            </h3>

            <p className="text-sm text-neutral-200 leading-relaxed mb-6 whitespace-pre-line bg-[#0f0f13] p-4 rounded-xl border border-neutral-800">
              {selectedAnnouncement.content}
            </p>

            <div className="flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800 pt-3 mb-5">
              <span>ผู้ประกาศ: <strong className="text-amber-200">{selectedAnnouncement.author}</strong></span>
              <span className="text-neutral-500">{selectedAnnouncement.role}</span>
            </div>

            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="w-full py-2.5 rounded-xl bg-[#FEE101] text-neutral-950 font-semibold text-xs sm:text-sm hover:bg-[#ffe83d] transition-colors cursor-pointer"
            >
              รับทราบประกาศ
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Announcement Modal for Managers */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#16161c] border-2 border-[#FEE101] rounded-2xl max-w-lg w-full p-6 shadow-[0_0_50px_rgba(254,225,1,0.25)] text-left relative">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
              <h3 className="font-cinzel text-lg font-bold text-[#FEE101] flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                <span>{editingAnnouncement ? 'แก้ไขประกาศบ้าน' : 'สร้างประกาศบ้านใหม่'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-200 mb-1">
                  หัวข้อประกาศ <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="เช่น กำหนดการนัดซ้อมเวทมนตร์ FiveM สัปดาห์นี้..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0f0f13] border border-[#FEE101]/30 focus:border-[#FEE101] text-sm text-amber-50 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-200 mb-1">
                    หมวดหมู่ประกาศ
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0f0f13] border border-[#FEE101]/30 text-xs text-amber-50 outline-none"
                  >
                    <option value="ข่าวสารสำคัญ">ข่าวสารสำคัญ</option>
                    <option value="กิจกรรม Roleplay">กิจกรรม Roleplay</option>
                    <option value="กฎระเบียบบ้าน">กฎระเบียบบ้าน</option>
                    <option value="ประกาศฝึกซ้อม">ประกาศฝึกซ้อม</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-200 mb-1">
                    การปักหมุด
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs text-amber-200">
                    <input
                      type="checkbox"
                      checked={formPinned}
                      onChange={(e) => setFormPinned(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 accent-[#FEE101]"
                    />
                    <span>ปักหมุดไว้บนสุด</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-200 mb-1">
                  เนื้อหาประกาศ <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="กรอกรายละเอียดประกาศ คำสั่งการ หรือจุดนัดพบในเกม..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f0f13] border border-[#FEE101]/30 focus:border-[#FEE101] text-sm text-amber-50 outline-none resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FEE101] hover:bg-[#ffe83d] text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {editingAnnouncement ? 'บันทึกการแก้ไข' : 'โพสต์ประกาศ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add / Edit Event Modal for Managers / Admin */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#16161c] border-2 border-[#FEE101] rounded-2xl max-w-lg w-full p-6 shadow-[0_0_50px_rgba(254,225,1,0.25)] text-left relative">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
              <h3 className="font-cinzel text-lg font-bold text-[#FEE101] flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{editingEvent ? 'แก้ไขกิจกรรม/กำหนดการ' : 'เพิ่มกิจกรรม/กำหนดการใหม่'}</span>
              </h3>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-200 mb-1">
                  ชื่อกิจกรรม / กำหนดการ <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formEventTitle}
                  onChange={(e) => setFormEventTitle(e.target.value)}
                  placeholder="เช่น นัดรวมตัวห้องนั่งเล่น, ซ้อมควิดดิชบ้าน..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0f0f13] border border-[#FEE101]/30 focus:border-[#FEE101] text-sm text-amber-50 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-200 mb-1">
                    วันที่ (เช่น 12 ก.ย. (เสาร์)) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formEventDateLabel}
                    onChange={(e) => setFormEventDateLabel(e.target.value)}
                    placeholder="เช่น 12 ก.ย. (เสาร์)"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0f0f13] border border-[#FEE101]/30 focus:border-[#FEE101] text-xs text-amber-50 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-200 mb-1">
                    หมวดหมู่กิจกรรม
                  </label>
                  <select
                    value={formEventCategory}
                    onChange={(e) => setFormEventCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0f0f13] border border-[#FEE101]/30 text-xs text-amber-50 outline-none"
                  >
                    <option value="meeting">การนัดหมาย / ประชุมบ้าน (Meeting)</option>
                    <option value="quidditch">ควิดดิช / กีฬา (Quidditch)</option>
                    <option value="class">คาบเรียนพิเศษ (Class)</option>
                    <option value="duel">ประลองเวทมนตร์ / กิจกรรม (Duel)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-200 mb-1">
                    เวลาจริง (IRL) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formEventTimeIrl}
                    onChange={(e) => setFormEventTimeIrl(e.target.value)}
                    placeholder="เช่น 20:00 - 21:30 น."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0f0f13] border border-[#FEE101]/30 focus:border-[#FEE101] text-xs text-amber-50 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-200 mb-1">
                    เวลาในเกม (RP)
                  </label>
                  <input
                    type="text"
                    value={formEventTimeRp}
                    onChange={(e) => setFormEventTimeRp(e.target.value)}
                    placeholder="เช่น 14:00 - 15:30 น."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0f0f13] border border-[#FEE101]/30 focus:border-[#FEE101] text-xs text-amber-50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-200 mb-1">
                  สถานที่นัดพบในเกม <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formEventLocation}
                  onChange={(e) => setFormEventLocation(e.target.value)}
                  placeholder="เช่น ห้องนั่งเล่นรวมฮัฟเฟิลพัฟ, สนามควิดดิช..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0f0f13] border border-[#FEE101]/30 focus:border-[#FEE101] text-sm text-amber-50 outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FEE101] hover:bg-[#ffe83d] text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {editingEvent ? 'บันทึกการแก้ไข' : 'เพิ่มกิจกรรม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
