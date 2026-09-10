import React, { useState, useRef } from 'react';
import { HufflepuffCrest } from './HufflepuffCrest';
import { HOUSE_ROLES_LIST, DEFAULT_DISCORD_USER } from '../data/hufflepuffData';
import { HouseRole, StudentProfile } from '../types';
import { saveUserProfileToFirestore } from '../lib/hufflepuffFirestore';
import { 
  Upload, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  ArrowRight,
  User, 
  GraduationCap, 
  ShieldAlert, 
  Sparkles,
  Image as ImageIcon,
  Check,
  AlertCircle,
  ShieldCheck,
  Database
} from 'lucide-react';

export interface DiscordAuthUser {
  id: string;
  username: string;
  global_name?: string;
  avatar: string;
  email?: string;
}

interface RegistrationViewProps {
  onBack: () => void;
  onSubmitSuccess: (profile: StudentProfile) => void;
  discordUser?: DiscordAuthUser | null;
  existingProfile?: StudentProfile | null;
}

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  onBack,
  onSubmitSuccess,
  discordUser,
  existingProfile,
}) => {
  const isEditing = Boolean(existingProfile);

  // Active Discord identity
  const currentDiscord = discordUser || {
    id: existingProfile?.discordId || DEFAULT_DISCORD_USER.id,
    username: existingProfile?.discordUsername || `${DEFAULT_DISCORD_USER.name}${DEFAULT_DISCORD_USER.tag}`,
    global_name: existingProfile?.name || DEFAULT_DISCORD_USER.name,
    avatar: existingProfile?.discordAvatar || DEFAULT_DISCORD_USER.avatar,
  };

  // Form fields (initialized from existingProfile if editing)
  const [characterName, setCharacterName] = useState(existingProfile?.name || '');
  const [studentId, setStudentId] = useState(existingProfile?.studentId || '');
  const [year, setYear] = useState<number>(existingProfile?.year || 1);
  // Multiple roles selection
  const [selectedRoles, setSelectedRoles] = useState<HouseRole[]>(
    existingProfile?.houseRoles && existingProfile.houseRoles.length > 0
      ? existingProfile.houseRoles
      : existingProfile?.houseRole
      ? [existingProfile.houseRole]
      : ['นักเรียนทั่วไป']
  );
  const [characterPhoto, setCharacterPhoto] = useState<string>(
    existingProfile?.characterPhoto || currentDiscord.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
  );
  const [bio, setBio] = useState(
    existingProfile?.bio || 'นักเรียนบ้านฮัฟเฟิลพัฟ มุ่งมั่นพัฒนาทักษะเวทมนตร์และช่วยเหลือเพื่อนสมาชิกทุกคน'
  );

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status Modal & Server State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedProfile, setSubmittedProfile] = useState<StudentProfile | null>(null);

  // Validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      readImageFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      readImageFile(file);
    }
  };

  const readImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (.png, .jpg, .webp)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setCharacterPhoto(uploadEvent.target.result as string);
        if (errors.characterPhoto) {
          setErrors(prev => ({ ...prev, characterPhoto: '' }));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleRole = (role: HouseRole) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) {
        return; // Keep at least one role
      }
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const newErrors: { [key: string]: string } = {};

    if (!characterName.trim()) {
      newErrors.characterName = 'กรุณากรอกชื่อ-นามสกุลในเกม Roleplay';
    }
    if (!studentId.trim()) {
      newErrors.studentId = 'กรุณากรอกรหัสนักศึกษา (เช่น 123456)';
    }
    if (!characterPhoto) {
      newErrors.characterPhoto = 'กรุณาแนบรูปภาพตัวละครในเกม';
    }
    if (selectedRoles.length === 0) {
      newErrors.roles = 'กรุณาเลือกตำแหน่งในบ้านอย่างน้อย 1 ตำแหน่ง';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    const profilePayload = {
      discordId: currentDiscord.id,
      name: characterName.trim(),
      studentId: studentId.trim(),
      year,
      houseRole: selectedRoles[0] || 'นักเรียนทั่วไป',
      houseRoles: selectedRoles,
      characterPhoto,
      discordUsername: currentDiscord.username,
      discordAvatar: currentDiscord.avatar,
      bio,
      possessedSpells: existingProfile?.possessedSpells || ['Lumos', 'Nox', 'Alohomora', 'Wingardium Leviosa'],
    };

    try {
      const endpoint = isEditing ? `/api/users/${currentDiscord.id}` : '/api/users';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setServerError(data.message || 'บัญชี Discord นี้ถูกใช้ลงทะเบียนไปแล้ว (1 บัญชี Discord สมัครได้ครั้งเดียว)');
        } else {
          setServerError(data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
        setIsSubmitting(false);
        return;
      }

      const savedUser = data.user || profilePayload;
      const finalProfile: StudentProfile = {
        discordId: savedUser.discordId,
        name: savedUser.name,
        studentId: savedUser.studentId,
        year: savedUser.year,
        houseRole: savedUser.houseRole,
        houseRoles: savedUser.houseRoles,
        characterPhoto: savedUser.characterPhoto,
        discordUsername: savedUser.discordUsername,
        discordAvatar: savedUser.discordAvatar,
        joinedDate: savedUser.joinedDate || new Date().toLocaleDateString('th-TH'),
        bio: savedUser.bio,
        pointsContributed: savedUser.pointsContributed || 0,
        possessedSpells: savedUser.possessedSpells || [],
      };

      // Save directly to Firebase Firestore (Hufflepuff Hogworlds database)
      try {
        await saveUserProfileToFirestore(finalProfile);
      } catch (firestoreErr) {
        console.warn('Firestore direct save warning (will sync):', firestoreErr);
      }

      setSubmittedProfile(finalProfile);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Submit error:', err);
      setServerError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProceedToDashboard = () => {
    if (submittedProfile) {
      onSubmitSuccess(submittedProfile);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d10] text-amber-50 py-10 px-4 sm:px-6 relative">
      {/* Background Ambience */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-[#FEE101]/10 via-amber-600/5 to-transparent blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-[#FEE101] mb-6 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>กลับสู่หน้าแรก</span>
        </button>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-8 bg-[#15151a] p-6 rounded-2xl border border-[#FEE101]/25">
          <HufflepuffCrest size="md" />
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-[#FEE101]/30 text-xs text-amber-300 font-medium mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#FEE101]" />
              <span>Hogworlds Wizardry Project • FiveM Roleplay</span>
            </div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-amber-100">
              {isEditing ? 'แก้ไขข้อมูลส่วนตัวสมาชิกบ้านฮัฟเฟิลพัฟ' : 'ลงทะเบียนสมาชิกบ้านฮัฟเฟิลพัฟ'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              {isEditing
                ? 'แก้ไขข้อมูลตัวละครและบทบาทในเกม FiveM SRP (ผู้ใช้สามารถแก้ไขข้อมูลได้ตลอดเวลา)'
                : 'กรอกข้อมูลตัวละครในเกม FiveM SRP ให้ครบถ้วน (1 บัญชี Discord สมัครได้ 1 ครั้ง)'}
            </p>
          </div>
        </div>

        {/* Discord Registration / Login Account Card */}
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#14141d] border border-[#5865F2]/40 shadow-lg shadow-[#5865F2]/5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#5865F2]/20">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] flex-shrink-0">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.894a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">บัญชี Discord ที่เชื่อมต่อ</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              เชื่อมต่อสำเร็จ
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-center gap-3.5">
              <div className="relative flex-shrink-0">
                <img
                  src={currentDiscord.avatar}
                  alt="Discord Avatar"
                  className="w-11 h-11 rounded-full object-cover border-2 border-[#5865F2]"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#14141d] rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white text-sm sm:text-base whitespace-nowrap">
                    {currentDiscord.global_name || currentDiscord.username}
                  </span>
                  <span className="text-neutral-400 text-xs font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 whitespace-nowrap">
                    @{currentDiscord.username}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  เชื่อมโยงสิทธิ์บัญชี 1:1 กับระบบฐานข้อมูลบ้านฮัฟเฟิลพัฟ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-xs text-neutral-400 font-mono bg-neutral-900/80 px-2.5 py-1.5 rounded-lg border border-neutral-800 whitespace-nowrap">
                ID: {currentDiscord.id}
              </span>
            </div>
          </div>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start gap-3 text-red-200 text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p>{serverError}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="bg-[#141418] p-6 sm:p-8 rounded-2xl border border-[#FEE101]/20 space-y-6">
          <div className="border-b border-[#FEE101]/10 pb-4">
            <h2 className="text-lg font-semibold text-amber-200 flex items-center gap-2">
              <User className="w-5 h-5 text-[#FEE101]" />
              <span>ข้อมูลตัวละครและบทบาทในเกม (In-Game RP Info)</span>
            </h2>
          </div>

          {/* Character Name & Student ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-neutral-200 mb-1.5">
                ชื่อ-นามสกุล ตัวละคร (Roleplay Name) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => {
                    setCharacterName(e.target.value);
                    if (errors.characterName) setErrors({ ...errors, characterName: '' });
                  }}
                  placeholder="เช่น Cedric Diggory หรือ Edward Lupin"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f0f13] border border-[#FEE101]/30 focus:border-[#FEE101] focus:ring-2 focus:ring-[#FEE101]/20 text-amber-50 text-sm outline-none transition-all placeholder:text-neutral-600"
                />
              </div>
              {errors.characterName && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.characterName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-neutral-200 mb-1.5">
                รหัสนักศึกษา (Student ID) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    if (errors.studentId) setErrors({ ...errors, studentId: '' });
                  }}
                  placeholder="เช่น 123456"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f0f13] border border-[#FEE101]/30 focus:border-[#FEE101] focus:ring-2 focus:ring-[#FEE101]/20 text-amber-50 text-sm outline-none transition-all placeholder:text-neutral-600"
                />
              </div>
              {errors.studentId && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.studentId}
                </p>
              )}
            </div>
          </div>

          {/* Academic Year Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-200 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[#FEE101]" />
              <span>ชั้นปีการศึกษา (Academic Year) <span className="text-red-400">*</span></span>
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f0f13] border border-[#FEE101]/30 focus:border-[#FEE101] focus:ring-2 focus:ring-[#FEE101]/20 text-amber-50 text-sm outline-none transition-all cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((y) => (
                <option key={y} value={y} className="bg-[#121216] text-amber-50">
                  ชั้นปีที่ {y} (Year {y})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-neutral-400 mt-1">
              กำหนดระดับวิชาและคาถาที่ได้รับอนุญาตให้ใช้ในเซิร์ฟเวอร์
            </p>
          </div>

          {/* Multiple Roles Selection (ตามข้อกำหนด: สามารถเลือกได้หลายตำแหน่ง) */}
          <div>
            <label className="flex items-center justify-between text-xs sm:text-sm font-medium text-neutral-200 mb-2">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#FEE101]" />
                <span>ตำแหน่งในบ้าน (House Roles) - เลือกได้หลายตำแหน่ง <span className="text-red-400">*</span></span>
              </span>
              <span className="text-[11px] text-amber-300 font-medium">
                เลือกแล้ว {selectedRoles.length} ตำแหน่ง
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {HOUSE_ROLES_LIST.map((roleOption) => {
                const isSelected = selectedRoles.includes(roleOption);
                const isRoleAdmin = roleOption === 'แอดมิน';
                return (
                  <button
                    key={roleOption}
                    type="button"
                    onClick={() => toggleRole(roleOption)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer ${
                      isSelected
                        ? isRoleAdmin
                          ? 'bg-[#FEE101]/25 border-[#FEE101] text-[#FEE101] ring-1 ring-[#FEE101] shadow-md shadow-[#FEE101]/20 font-bold'
                          : 'bg-[#FEE101]/15 border-[#FEE101] text-[#FEE101] shadow-sm shadow-[#FEE101]/10'
                        : isRoleAdmin
                        ? 'bg-[#181822] border-amber-500/50 text-amber-200 hover:border-[#FEE101]'
                        : 'bg-[#0f0f13] border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {isRoleAdmin && <span className="text-amber-400">🛡️</span>}
                      <span>{roleOption}</span>
                      {isRoleAdmin && <span className="text-[10px] text-amber-300 font-normal">(Admin)</span>}
                    </span>
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-[#FEE101] flex-shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-neutral-700 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            {errors.roles && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.roles}
              </p>
            )}
            {selectedRoles.includes('แอดมิน') ? (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-500/15 border border-[#FEE101]/40 text-xs text-amber-200 flex items-start gap-2.5 animate-in fade-in">
                <ShieldCheck className="w-4 h-4 text-[#FEE101] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#FEE101]">ยศแอดมิน (Admin Role) เปิดใช้งาน:</strong> บัญชีนี้มีสิทธิ์สูงสุดในการ <strong>เพิ่ม ลบ หรือแก้ไขปฏิทิน ตารางเรียน และกิจกรรมบ้าน</strong> ได้อย่างอิสระ
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-neutral-400 mt-2">
                หมายเหตุ: เลือกตำแหน่ง <strong className="text-[#FEE101]">"แอดมิน"</strong> หรือ "Badger วิชาการ" เพื่อรับสิทธิ์ในการเพิ่ม ลบ และแก้ไขปฏิทินตารางเรียน
              </p>
            )}
          </div>

          {/* Image Upload Area with Drag & Drop & File Selection (ระบบใส่รูปด่วนถูกนำออกแล้ว) */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-200 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#FEE101]" />
                <span>แนบรูปภาพตัวละครในเกม (Character Portrait) <span className="text-red-400">*</span></span>
              </span>
              <span className="text-[11px] text-neutral-400">Drag & Drop หรือคลิกเลือกรูป</span>
            </label>

            {/* Upload Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#FEE101] bg-[#FEE101]/10 scale-[1.01]'
                  : 'border-[#FEE101]/30 bg-[#0f0f13]/80 hover:border-[#FEE101]/60 hover:bg-[#15151a]'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                {/* Image Preview */}
                {characterPhoto ? (
                  <div className="relative group flex-shrink-0">
                    <img
                      src={characterPhoto}
                      alt="Character Preview"
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border-2 border-[#FEE101] shadow-md shadow-amber-500/20"
                    />
                    <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-amber-200 transition-opacity font-medium">
                      เปลี่ยนรูปภาพ
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-neutral-900 border border-neutral-700 flex flex-col items-center justify-center text-neutral-500 flex-shrink-0">
                    <Upload className="w-8 h-8 mb-1" />
                    <span className="text-[10px]">ยังไม่มีรูป</span>
                  </div>
                )}

                <div className="text-center sm:text-left">
                  <p className="text-sm font-medium text-amber-200 mb-1">
                    ลากและวางรูปภาพตัวละคร หรือ <span className="text-[#FEE101] underline">คลิกเพื่อเลือกไฟล์</span>
                  </p>
                  <p className="text-xs text-neutral-400">
                    รองรับไฟล์ JPG, PNG, WEBP สำหรับแสดงบนทำเนียบสมาชิกบ้านฮัฟเฟิลพัฟ
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-amber-300/80 bg-amber-950/40 px-2.5 py-1 rounded-md border border-[#FEE101]/20">
                    <Check className="w-3 h-3 text-[#FEE101]" />
                    <span>ใช้เป็นภาพโปรไฟล์ทางการใน Hogworlds Wizardry Project</span>
                  </div>
                </div>
              </div>
            </div>

            {errors.characterPhoto && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.characterPhoto}
              </p>
            )}
          </div>

          {/* Short Bio (ตามข้อกำหนด: เปลี่ยนข้อความเป็น 'ประวัติย่อ') */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-200 mb-1.5">
              ประวัติย่อ
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="กรอกประวัติย่อ ปูมหลังตัวละคร หรือข้อมูลแนะนำตัว..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0f0f13] border border-[#FEE101]/30 focus:border-[#FEE101] focus:ring-2 focus:ring-[#FEE101]/20 text-amber-50 text-sm outline-none transition-all placeholder:text-neutral-600 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              id="btn-submit-application"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-base text-neutral-950 bg-gradient-to-r from-[#FFF066] via-[#FEE101] to-[#D4A10B] hover:brightness-110 shadow-lg shadow-[#FEE101]/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-neutral-950" />
                  <span>{isEditing ? 'บันทึกการแก้ไขข้อมูลสมาชิก' : 'ลงทะเบียนสมาชิกบ้านฮัฟเฟิลพัฟ'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal Notification */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#16161c] border-2 border-[#FEE101] rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-[0_0_50px_rgba(254,225,1,0.2)] text-center relative">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-[#FEE101] flex items-center justify-center text-[#FEE101] mx-auto mb-4 shadow-[0_0_20px_rgba(254,225,1,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-[#FEE101] mb-2">
              {isEditing ? 'บันทึกข้อมูลสำเร็จ!' : 'ลงทะเบียนสำเร็จ!'}
            </h3>

            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6">
              ระบบได้บันทึกข้อมูลของ <strong className="text-amber-200">{characterName}</strong> (
              รหัส {studentId}, ชั้นปีที่ {year}) เข้าสู่ฐานข้อมูลบ้านฮัฟเฟิลพัฟเรียบร้อยแล้ว
            </p>

            {/* Quick Preview Card */}
            <div className="p-3 bg-[#0e0e12] rounded-xl border border-neutral-800 text-left flex items-center gap-3 mb-6">
              <img
                src={characterPhoto}
                alt="character"
                className="w-12 h-12 rounded-lg object-cover border border-[#FEE101]"
              />
              <div className="text-xs">
                <p className="font-semibold text-white">{characterName}</p>
                <p className="text-neutral-400">
                  ตำแหน่ง:{' '}
                  <span className="text-[#FEE101]">
                    {selectedRoles.join(', ')}
                  </span>
                </p>
                <p className="text-neutral-500">Discord: @{currentDiscord.username} (ID: {currentDiscord.id})</p>
              </div>
            </div>

            {/* Action Buttons to proceed directly */}
            <div className="space-y-2.5">
              <button
                onClick={handleProceedToDashboard}
                id="btn-enter-dashboard"
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-neutral-950 bg-[#FEE101] hover:bg-[#ffe83d] transition-all shadow-md shadow-[#FEE101]/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>เข้าสู่ห้องนั่งเล่นรวม (House Dashboard)</span>
                <ArrowRight className="w-4 h-4 text-neutral-950" />
              </button>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2.5 px-4 rounded-xl text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                แก้ไขข้อมูลใบสมัครเพิ่มเติม
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
