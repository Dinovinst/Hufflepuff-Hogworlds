import React, { useState } from 'react';

interface CrestProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withGlow?: boolean;
}

export const HufflepuffCrest: React.FC<CrestProps> = ({
  className = '',
  size = 'md',
  withGlow = true,
}) => {
  const [useFallbackSvg, setUseFallbackSvg] = useState(false);

  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${sizeMap[size]} ${className}`}
    >
      {withGlow && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-[#FEE101]/30 to-amber-300/10 blur-xl animate-pulse -z-10" />
      )}

      {!useFallbackSvg ? (
        <img
          src="/HFF.png"
          alt="Hufflepuff Crest"
          onError={() => setUseFallbackSvg(true)}
          className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(254,225,1,0.3)] select-none"
        />
      ) : (
        <svg
          viewBox="0 0 100 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(254,225,1,0.25)]"
        >
          <defs>
            <linearGradient id="shieldBorder" x1="0" y1="0" x2="100" y2="120" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFF275" />
              <stop offset="0.4" stopColor="#FEE101" />
              <stop offset="0.8" stopColor="#C69214" />
              <stop offset="1" stopColor="#785303" />
            </linearGradient>
            <linearGradient id="shieldBg" x1="50" y1="5" x2="50" y2="115" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E1C14" />
              <stop offset="0.5" stopColor="#141416" />
              <stop offset="1" stopColor="#0D0D0F" />
            </linearGradient>
            <linearGradient id="goldRibbon" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9E7610" />
              <stop offset="0.3" stopColor="#FEE101" />
              <stop offset="0.7" stopColor="#FFEA6B" />
              <stop offset="1" stopColor="#9E7610" />
            </linearGradient>
          </defs>

          {/* Shield Outer Outline */}
          <path
            d="M50 4 C78 4 94 16 94 48 C94 85 50 116 50 116 C50 116 6 85 6 48 C6 16 22 4 50 4 Z"
            fill="url(#shieldBg)"
            stroke="url(#shieldBorder)"
            strokeWidth="3.5"
          />

          {/* Inner Shield Border */}
          <path
            d="M50 10 C74 10 88 20 88 48 C88 80 50 108 50 108 C50 108 12 80 12 48 C12 20 26 10 50 10 Z"
            fill="none"
            stroke="#FEE101"
            strokeWidth="1"
            strokeDasharray="3 3"
            strokeOpacity="0.45"
          />

          {/* Diagonal House Stripes */}
          <path d="M12 42 L88 42" stroke="#FEE101" strokeWidth="0.8" strokeOpacity="0.25" />
          <path d="M16 64 L84 64" stroke="#FEE101" strokeWidth="0.8" strokeOpacity="0.25" />

          {/* Stylized Badger Silhouette */}
          <g id="badger" transform="translate(25, 28) scale(0.5)">
            <path
              d="M50 20 C65 20 80 35 85 55 C90 75 80 90 60 95 C45 98 25 90 20 75 C15 60 20 40 35 25 C40 21 45 20 50 20 Z"
              fill="#232328"
              stroke="#D8B11B"
              strokeWidth="2.5"
            />
            <path
              d="M38 25 C45 28 55 28 62 25 C68 38 65 52 50 60 C35 52 32 38 38 25 Z"
              fill="#F5E8BA"
            />
            <path
              d="M48 24 L52 24 L52 46 C52 48 48 48 48 46 Z"
              fill="#121214"
            />
            <circle cx="34" cy="24" r="5" fill="#FEE101" />
            <circle cx="66" cy="24" r="5" fill="#FEE101" />
            <ellipse cx="25" cy="80" rx="6" ry="4" fill="#D8B11B" />
            <ellipse cx="75" cy="80" rx="6" ry="4" fill="#D8B11B" />
          </g>

          {/* Golden House Star / Sparkle at Top */}
          <path
            d="M50 14 L52 20 L58 22 L52 24 L50 30 L48 24 L42 22 L48 20 Z"
            fill="#FFF48F"
          />

          {/* Ribbon Banner at Bottom */}
          <path
            d="M20 92 L50 96 L80 92 L75 102 L50 106 L25 102 Z"
            fill="url(#goldRibbon)"
          />
          <text
            x="50"
            y="101"
            textAnchor="middle"
            fill="#1A180E"
            fontSize="5.5"
            fontWeight="900"
            letterSpacing="0.8"
            fontFamily="'Cinzel', serif"
          >
            HUFFLEPUFF
          </text>
        </svg>
      )}
    </div>
  );
};
