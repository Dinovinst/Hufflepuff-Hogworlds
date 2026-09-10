import React, { useState } from 'react';
import { OWNER_PASSCODE } from '../utils/permissions';
import { Crown, KeyRound, Check, AlertCircle, X, ShieldAlert } from 'lucide-react';

interface OwnerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOwnerAuthenticated: boolean;
  onAuthenticated: () => void;
  onRevoke: () => void;
}

export const OwnerAuthModal: React.FC<OwnerAuthModalProps> = ({
  isOpen,
  onClose,
  isOwnerAuthenticated,
  onAuthenticated,
  onRevoke,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passcode.trim() === OWNER_PASSCODE) {
      setSuccess('ยืนยันสิทธิ์เจ้าของเว็บสำเร็จ! คุณได้รับสิทธิ์ควบคุมและแต่งตั้งแอดมิน');
      localStorage.setItem('hufflepuff_owner_authenticated', 'true');
      setTimeout(() => {
        onAuthenticated();
        onClose();
      }, 900);
    } else {
      setError('รหัสผ่านเจ้าของเว็บไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
    }
  };

  const handleRevokeClick = () => {
    localStorage.removeItem('hufflepuff_owner_authenticated');
    onRevoke();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#14141a] border-2 border-[#FEE101] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_0_50px_rgba(254,225,1,0.3)] text-left relative">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-[#FEE101]/40 flex items-center justify-center text-[#FEE101] flex-shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-cinzel text-lg sm:text-xl font-bold text-amber-100">
                สิทธิ์เจ้าของเว็บ (Website Owner)
              </h3>
              <p className="text-xs text-neutral-400">
                ระบบจัดการยศแอดมินและควบคุมสูงสุด
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isOwnerAuthenticated ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-[#FEE101]/40 text-xs text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#FEE101] text-sm">
                <Crown className="w-4 h-4" />
                <span>สถานะ: เจ้าของเว็บ (Owner Mode Active)</span>
              </div>
              <p className="leading-relaxed text-neutral-300">
                ขณะนี้คุณมีสิทธิ์สูงสุดในการแต่งตั้งหรือถอดยศ <strong>"แอดมิน"</strong> และจัดการตำแหน่งของสมาชิกทุกคนในหน้า <strong>"ทำเนียบสมาชิก"</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRevokeClick}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 border border-red-500/30 text-red-400 hover:bg-red-950/40 text-xs font-semibold transition-colors cursor-pointer"
              >
                ออกจากโหมดเจ้าของเว็บ
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-[#FEE101] text-neutral-950 text-xs font-bold hover:bg-[#ffe83d] transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#0f0f14] border border-neutral-800 text-xs text-neutral-300">
              <p className="leading-relaxed">
                ตามข้อกำหนดของบ้าน ยศ <strong>"แอดมิน"</strong> จะสามารถใส่หรือแต่งตั้งให้คนอื่นได้โดย <strong>เจ้าของเว็บเพียงคนเดียว</strong> กรุณากรอกรหัสผ่านเจ้าของเว็บเพื่อปลดล็อกฟังก์ชันนี้
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#FEE101]" />
                <span>รหัสผ่านเจ้าของเว็บ (Owner Passcode)</span>
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="กรอกรหัสผ่านเจ้าของเว็บ"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0b0e] border border-neutral-700 focus:border-[#FEE101] text-sm text-amber-50 outline-none transition-all placeholder:text-neutral-600"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#FEE101] text-neutral-950 text-xs font-bold hover:bg-[#ffe83d] transition-all cursor-pointer shadow-md shadow-[#FEE101]/20 flex items-center justify-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>ยืนยันสิทธิ์เจ้าของ</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
