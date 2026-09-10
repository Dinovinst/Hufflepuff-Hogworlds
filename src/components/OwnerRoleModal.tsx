import React, { useState, useEffect } from 'react';
import { HouseRole, DirectoryMember } from '../types';
import { REGISTERABLE_HOUSE_ROLES } from '../data/hufflepuffData';
import { 
  Crown, 
  ShieldCheck, 
  Shield, 
  Check, 
  X, 
  Sparkles, 
  AlertCircle,
  Save,
  Loader2
} from 'lucide-react';

interface OwnerRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: DirectoryMember | null;
  onSaveRoles: (
    memberDiscordId: string, 
    updatedRoles: HouseRole[], 
    primaryRole?: HouseRole
  ) => Promise<void>;
}

export const OwnerRoleModal: React.FC<OwnerRoleModalProps> = ({
  isOpen,
  onClose,
  member,
  onSaveRoles,
}) => {
  if (!isOpen || !member) return null;

  const currentRoles = member.roles && member.roles.length > 0 ? member.roles : [member.role];
  const [isAdminGranted, setIsAdminGranted] = useState<boolean>(
    currentRoles.includes('แอดมิน')
  );
  const [selectedHouseRoles, setSelectedHouseRoles] = useState<HouseRole[]>(
    currentRoles.filter((r) => r !== 'แอดมิน' && r !== 'เจ้าของเว็บ')
  );
  const [primaryRole, setPrimaryRole] = useState<HouseRole>(member.role || 'นักเรียนทั่วไป');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state when member changes
  useEffect(() => {
    if (member) {
      const roles = member.roles && member.roles.length > 0 ? member.roles : [member.role];
      setIsAdminGranted(roles.includes('แอดมิน'));
      const nonAdmin = roles.filter((r) => r !== 'แอดมิน' && r !== 'เจ้าของเว็บ');
      setSelectedHouseRoles(nonAdmin.length > 0 ? nonAdmin : ['นักเรียนทั่วไป']);
      setPrimaryRole(member.role || 'นักเรียนทั่วไป');
      setStatusMessage(null);
    }
  }, [member]);

  const toggleHouseRole = (role: HouseRole) => {
    setSelectedHouseRoles((prev) => {
      if (prev.includes(role)) {
        if (prev.length === 1 && !isAdminGranted) {
          return prev; // keep at least one role
        }
        return prev.filter((r) => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    // Build the updated roles array
    const compiledRoles: HouseRole[] = [];
    if (isAdminGranted) {
      compiledRoles.push('แอดมิน');
    }
    for (const r of selectedHouseRoles) {
      if (!compiledRoles.includes(r)) {
        compiledRoles.push(r);
      }
    }
    if (compiledRoles.length === 0) {
      compiledRoles.push('นักเรียนทั่วไป');
    }

    // Resolve primary role
    let resolvedPrimary = primaryRole;
    if (!compiledRoles.includes(resolvedPrimary)) {
      resolvedPrimary = compiledRoles[0];
    }

    try {
      // Extract clean discordId (if id is 'mem-12345', extract or use member.id)
      const cleanDiscordId = member.id.startsWith('mem-') 
        ? member.id.replace('mem-', '') 
        : member.id;

      await onSaveRoles(cleanDiscordId, compiledRoles, resolvedPrimary);

      setStatusMessage({
        type: 'success',
        text: `อัปเดตยศของ ${member.name} สำเร็จเรียบร้อย!`,
      });

      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to save roles:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'เกิดข้อผิดพลาดในการบันทึกยศ กรุณาลองใหม่อีกครั้ง',
      });
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#14141a] border-2 border-[#FEE101] rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-[0_0_60px_rgba(254,225,1,0.25)] text-left relative max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-[#FEE101]/40 flex items-center justify-center text-[#FEE101] flex-shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEE101]/10 text-[#FEE101] text-[10px] font-bold border border-[#FEE101]/30">
                <span>OWNER ROLE MANAGER</span>
              </div>
              <h3 className="font-cinzel text-lg sm:text-xl font-bold text-amber-100">
                จัดการยศและสิทธิ์สมาชิก
              </h3>
              <p className="text-xs text-neutral-400">
                แต่งตั้งยศแอดมินหรือกำหนดบทบาทหน้าที่ในบ้านฮัฟเฟิลพัฟ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-neutral-400 hover:text-white p-2 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* Target Member Banner */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#0e0e13] border border-neutral-800">
            <img
              src={member.avatar}
              alt={member.name}
              className="w-12 h-12 rounded-xl object-cover border border-[#FEE101]/60"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-amber-100 truncate">
                {member.name}
              </h4>
              <p className="text-xs text-neutral-400">
                รหัสนักศึกษา: <span className="font-mono text-[#FEE101]">{member.studentId}</span> • ปี {member.year}
              </p>
            </div>
          </div>

          {/* SECTION 1: Exclusive Admin Role Switch (Highest Privilege) */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-[#FEE101]/50 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#FEE101] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-[#FEE101] flex items-center gap-2">
                    <span>ยศแอดมิน (Admin Status)</span>
                    <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-300 font-normal">
                      เฉพาะเจ้าของเว็บแต่งตั้งได้
                    </span>
                  </h4>
                  <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                    เมื่อเปิดใช้งาน สมาชิกท่านนี้จะมีสิทธิ์ <strong>เพิ่ม แก้ไข และลบปฏิทิน ตารางเรียน และประกาศกิจกรรม</strong> ของบ้านฮัฟเฟิลพัฟได้
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setIsAdminGranted(!isAdminGranted)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAdminGranted ? 'bg-[#FEE101]' : 'bg-neutral-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isAdminGranted ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isAdminGranted && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/30">
                <Check className="w-3.5 h-3.5" />
                <span>สมาชิกท่านนี้จะได้รับสิทธิ์แอดมินทันทีหลังบันทึก</span>
              </div>
            )}
          </div>

          {/* SECTION 2: House Roles Multi-Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
              ตำแหน่งและบทบาทหน้าที่ในบ้าน (House Roles)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {REGISTERABLE_HOUSE_ROLES.map((role) => {
                const isSelected = selectedHouseRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleHouseRole(role)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#FEE101]/15 border-[#FEE101] text-[#FEE101] font-bold shadow-sm'
                        : 'bg-[#0f0f13] border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    <span className="truncate">{role}</span>
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-[#FEE101] flex-shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-neutral-700 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: Primary Role Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
              ยศหลักที่ต้องการให้แสดงบนการ์ด (Primary Role)
            </label>
            <select
              value={primaryRole}
              onChange={(e) => setPrimaryRole(e.target.value as HouseRole)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e13] border border-neutral-700 focus:border-[#FEE101] text-xs sm:text-sm text-amber-100 outline-none transition-all cursor-pointer"
            >
              {isAdminGranted && <option value="แอดมิน">แอดมิน (Admin)</option>}
              {selectedHouseRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Status feedback */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950/60 border-red-500/50 text-red-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white hover:border-neutral-700 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FEE101] text-neutral-950 text-xs font-bold hover:bg-[#ffe83d] transition-all cursor-pointer shadow-md shadow-[#FEE101]/20 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังบันทึกยศ...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>บันทึกการแต่งตั้งยศ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
