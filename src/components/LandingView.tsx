import React from 'react';
import { HufflepuffCrest } from './HufflepuffCrest';
import { Sparkles } from 'lucide-react';

interface LandingViewProps {
  onLoginDiscord: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onLoginDiscord,
}) => {
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
              onClick={onLoginDiscord}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-md shadow-[#5865F2]/25 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer"
            >
              {/* Discord SVG */}
              <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.894a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>เข้าสู่ระบบด้วย Discord</span>
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
        <p className="text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed mb-10">
          ยินดีต้อนรับนักเรียนพ่อมดแม่มดสู่บ้านฮัฟเฟิลพัฟ ในเซิร์ฟเวอร์ Hogworlds Wizardry Project (FiveM SRP)
          ห้องนั่งเล่นรวมอันแสนอบอุ่นข้างห้องครัวปราสาท ที่ซึ่งความซื่อสัตย์ ความยุติธรรม และมิตรภาพอันแน่วแน่คือหัวใจสำคัญของเรา
        </p>

        {/* Primary Action Button */}
        <div className="flex items-center justify-center w-full max-w-md mx-auto">
          <button
            onClick={onLoginDiscord}
            id="btn-discord-login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-sm sm:text-base text-white bg-[#5865F2] hover:bg-[#4752C4] shadow-[0_4px_25px_rgba(88,101,242,0.35)] hover:shadow-[0_6px_30px_rgba(88,101,242,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap cursor-pointer"
          >
            <svg className="w-5 h-5 fill-current flex-shrink-0" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.894a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span>ลงทะเบียนเข้าสู่ระบบด้วย Discord</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#FEE101]/10 py-6 text-center text-xs text-neutral-500">
        <p>© Hogworlds Wizardry Project • FiveM SRP Hufflepuff House Community</p>
        <p className="mt-1 text-neutral-600">Yellow & Black • Loyal, Just, and True</p>
      </footer>
    </div>
  );
};
