import React, { useState, useEffect } from 'react';
import { HufflepuffCrest } from './HufflepuffCrest';
import { Sparkles, AlertCircle, X, Database } from 'lucide-react';
import { StudentProfile } from '../types';
import { DiscordAuthUser } from './RegistrationView';
import { getUserProfileFromFirestore } from '../lib/hufflepuffFirestore';

interface LandingViewProps {
  onLoginSuccess: (profile: StudentProfile) => void;
  onNeedRegistration: (discordUser: DiscordAuthUser) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onLoginSuccess,
  onNeedRegistration,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string>('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [manualDiscordId, setManualDiscordId] = useState('');
  const [manualDiscordName, setManualDiscordName] = useState('');

  // Process Discord user identity from OAuth or identification
  const handleDiscordUserReceived = async (discordUser: DiscordAuthUser) => {
    setIsLoading(true);
    setAuthError('');
    try {
      // 1. Check in Firestore database (Hufflepuff Hogworlds)
      const firestoreProfile = await getUserProfileFromFirestore(discordUser.id);
      if (firestoreProfile) {
        onLoginSuccess(firestoreProfile);
        return;
      }

      // 2. Check local server fallback
      const res = await fetch(`/api/users/${discordUser.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          onLoginSuccess(data.user);
          return;
        }
      }
      // Not registered yet -> proceed to registration view with Discord locked in
      onNeedRegistration(discordUser);
    } catch (err) {
      console.error('Failed to verify user profile:', err);
      // Still allow proceeding to registration
      onNeedRegistration(discordUser);
    } finally {
      setIsLoading(false);
    }
  };

  // Primary Discord Login Click Handler
  const handleInitiateDiscordLogin = async () => {
    setIsLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/auth/discord/url');
      const data = await res.json();

      if (data.configured && data.url) {
        // Real Discord OAuth credentials exist -> Open Popup
        const width = 560;
        const height = 750;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          data.url,
          'discord_oauth_popup',
          `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
        );

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // Popup blocked by browser -> fallback to direct redirect or prompt
          setAuthError('เบราว์เซอร์บล็อกป๊อปอัป กรุณาอนุญาตป๊อปอัปเพื่อเข้าสู่ระบบ Discord หรือใช้การระบุบัญชี');
          setShowConfigModal(true);
          setIsLoading(false);
          return;
        }

        const messageHandler = async (event: MessageEvent) => {
          if (event.data && event.data.type === 'DISCORD_AUTH_SUCCESS') {
            window.removeEventListener('message', messageHandler);
            if (event.data.discordUser) {
              await handleDiscordUserReceived(event.data.discordUser);
            }
          } else if (event.data && event.data.type === 'DISCORD_AUTH_ERROR') {
            window.removeEventListener('message', messageHandler);
            setIsLoading(false);
            setAuthError(`การเข้าสู่ระบบ Discord ล้มเหลว: ${event.data.error || 'กรุณาลองใหม่อีกครั้ง'}`);
          }
        };

        window.addEventListener('message', messageHandler);
      } else {
        // OAuth keys not yet in .env -> open direct identify modal
        setIsLoading(false);
        setShowConfigModal(true);
      }
    } catch (err: any) {
      console.error('Discord auth url error:', err);
      setIsLoading(false);
      setShowConfigModal(true);
    }
  };

  const handleManualIdentifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDiscordId.trim()) {
      setAuthError('กรุณากรอก Discord ID ของคุณ');
      return;
    }

    setIsLoading(true);
    setAuthError('');
    setShowConfigModal(false);

    try {
      // Check in Firestore first
      const firestoreProfile = await getUserProfileFromFirestore(manualDiscordId.trim());
      if (firestoreProfile) {
        onLoginSuccess(firestoreProfile);
        return;
      }

      const res = await fetch('/api/auth/discord/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordId: manualDiscordId.trim(),
          username: manualDiscordName.trim() || `User_${manualDiscordId.trim().slice(-4)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการตรวจสอบบัญชี');
      }

      if (data.registered && data.user) {
        onLoginSuccess(data.user);
      } else {
        onNeedRegistration(data.discordUser);
      }
    } catch (err: any) {
      setAuthError(err.message || 'ไม่สามารถตรวจสอบบัญชีได้');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0d0d10] overflow-hidden text-amber-50">
      {/* Magical Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-b from-[#FEE101]/15 via-amber-600/5 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-[#FEE101]/10 rounded-full blur-[110px] pointer-events-none -z-10" />

      {/* Subtle Magical Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#fee10106_1px,transparent_1px),linear-gradient(to_bottom,#fee10106_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none -z-20" />

      {/* Top Floating Mini Bar */}
      <header className="w-full border-b border-[#FEE101]/20 bg-[#121216]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HufflepuffCrest size="sm" withGlow={false} />
            <div>
              <span className="font-cinzel text-lg font-bold tracking-wider text-[#FEE101]">
                HUFFLEPUFF
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs uppercase px-2 py-0.5 rounded bg-amber-950/70 border border-[#FEE101]/30 text-amber-200 tracking-widest">
                Hogworlds Wizardry Project
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleInitiateDiscordLogin}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-md shadow-[#5865F2]/25 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {/* Discord SVG */}
              <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.894a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>{isLoading ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย Discord'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 lg:py-24 max-w-4xl mx-auto w-full text-center">
        {/* House Motto Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1e1c15] border border-[#FEE101]/40 text-xs sm:text-sm font-medium text-amber-300 mb-8 shadow-[0_0_20px_rgba(254,225,1,0.15)]">
          <Sparkles className="w-4 h-4 text-[#FEE101]" />
          <span>Hogworlds Wizardry Project • FiveM Roleplay Community</span>
        </div>

        {/* Hufflepuff Crest */}
        <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
          <HufflepuffCrest size="xl" withGlow={true} />
        </div>

        {/* Main Title with Magical Font */}
        <h1 className="font-cinzel text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#FFF59D] via-[#FEE101] to-[#C89B10] mb-4">
          HOUSE HUFFLEPUFF
        </h1>

        {/* Latin & English Motto */}
        <p className="font-cinzel text-base sm:text-xl font-medium tracking-wide text-amber-200/90 mb-4 max-w-2xl">
          "Where they are just and loyal, those patient Hufflepuffs are true and unafraid of toil."
        </p>

        {/* Refined Thai Welcome for Hogworlds Wizardry Project */}
        <p className="text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed mb-8">
          ยินดีต้อนรับนักเรียนพ่อมดแม่มดสู่บ้านฮัฟเฟิลพัฟ ในเซิร์ฟเวอร์ Hogworlds Wizardry Project (FiveM SRP)
          ห้องนั่งเล่นรวมอันแสนอบอุ่นข้างห้องครัวปราสาท ที่ซึ่งความซื่อสัตย์ ความยุติธรรม และมิตรภาพอันแน่วแน่คือหัวใจสำคัญของเรา
        </p>

        {/* Auth Error Banner if any */}
        {authError && (
          <div className="mb-6 p-4 max-w-md w-full rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs sm:text-sm flex items-start gap-2.5 text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto gap-3">
          <button
            onClick={handleInitiateDiscordLogin}
            disabled={isLoading}
            id="btn-discord-login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-sm sm:text-base text-white bg-[#5865F2] hover:bg-[#4752C4] shadow-[0_4px_25px_rgba(88,101,242,0.35)] hover:shadow-[0_6px_30px_rgba(88,101,242,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังดำเนินการเข้าสู่ระบบ Discord...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 fill-current flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.894a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span>เข้าสู่ระบบด้วย Discord</span>
              </>
            )}
          </button>
          <span className="text-xs text-neutral-400">
            * 1 บัญชี Discord ลงทะเบียนได้ 1 ตัวละคร และสามารถแก้ไขข้อมูลส่วนตัวได้ตลอด
          </span>

          <div className="inline-flex items-center gap-2 px-3 py-1 mt-1 rounded-full bg-amber-500/10 border border-[#FEE101]/20 text-xs text-amber-300">
            <Database className="w-3.5 h-3.5 text-[#FEE101]" />
            <span>ฐานข้อมูลคลาวด์: Firebase • Hufflepuff Hogworlds</span>
          </div>
        </div>
      </main>

      {/* Manual Discord Identification / Direct Login Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#15151c] border border-[#5865F2]/50 rounded-2xl max-w-md w-full p-6 text-left relative shadow-[0_0_50px_rgba(88,101,242,0.25)]">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.894a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-bold text-white">เข้าสู่ระบบด้วย Discord</h3>
                <p className="text-xs text-neutral-400">ระบุ Discord ID ของคุณเพื่อตรวจสอบหรือลงทะเบียน</p>
              </div>
            </div>

            <form onSubmit={handleManualIdentifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Discord ID (ตัวเลข 18-19 หลัก) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 312059385928174592"
                  value={manualDiscordId}
                  onChange={(e) => setManualDiscordId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e13] border border-neutral-700 focus:border-[#5865F2] text-sm text-white outline-none"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  * สามารถคลิกขวาที่โปรไฟล์ตัวเองใน Discord แล้วกด 'Copy User ID'
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Discord Username (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  placeholder="เช่น Cedric_Diggory"
                  value={manualDiscordName}
                  onChange={(e) => setManualDiscordName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0e13] border border-neutral-700 focus:border-[#5865F2] text-sm text-white outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#5865F2] hover:bg-[#4752C4] shadow-md shadow-[#5865F2]/30 transition-all cursor-pointer"
                >
                  ยืนยันและเข้าสู่ระบบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-[#FEE101]/10 py-6 text-center text-xs text-neutral-500">
        <p>© Hogworlds Wizardry Project • FiveM SRP Hufflepuff House Community</p>
        <p className="mt-1 text-neutral-600">Yellow & Black • Loyal, Just, and True</p>
      </footer>
    </div>
  );
};

