import React, { useState } from 'react';
import logoAsset from '../assets/images/km_logo_user_1790431487351.jpg';

interface KMLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showText?: boolean;
  textColor?: string;
  subtextColor?: string;
}

/**
 * KM Real Estate Logo.
 * Matches the user's uploaded circular insignia badge:
 * - Neutral light gray badge base (#e5e7e8)
 * - Solid black circular border ring
 * - Arched text "UNLOCKING" on top curve
 * - Arched text "DREAMS TO YOUR DOOR" on bottom curve
 * - Olive-gold house roof gable with chimney and 4-pane attic window
 * - Fresh green leaf curving gracefully over roofline
 * - Bold red "KM" in center with subtle drop shadow
 */
export const KMLogo: React.FC<KMLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  textColor = 'text-white',
  subtextColor = 'text-emerald-400',
}) => {
  const [imageError, setImageError] = useState(false);

  // Compute px size
  let pxSize = 44;
  if (typeof size === 'number') {
    pxSize = size;
  } else {
    switch (size) {
      case 'xs':
        pxSize = 28;
        break;
      case 'sm':
        pxSize = 36;
        break;
      case 'md':
        pxSize = 44;
        break;
      case 'lg':
        pxSize = 60;
        break;
      case 'xl':
        pxSize = 92;
        break;
    }
  }

  // Vector SVG emblem matching the uploaded logo exactly
  const renderSvgEmblem = () => (
    <svg
      viewBox="0 0 200 200"
      width={pxSize}
      height={pxSize}
      className="shrink-0 select-none drop-shadow-sm"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Top Arc for UNLOCKING */}
        <path id="kmTopCurve" d="M 32,100 A 68,68 0 0,1 168,100" fill="none" />
        {/* Bottom Arc for DREAMS TO YOUR DOOR */}
        <path id="kmBottomCurve" d="M 168,100 A 68,68 0 0,1 32,100" fill="none" />

        {/* Drop shadow filter for KM letters */}
        <filter id="kmDropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Outer Circle Ring with light gray background */}
      <circle cx="100" cy="100" r="96" fill="#e5e7e8" stroke="#121212" strokeWidth="3" />

      {/* Inner thin circular accent arcs */}
      <path
        d="M 50,65 A 64,64 0 0,1 150,65"
        fill="none"
        stroke="#222222"
        strokeWidth="0.8"
        strokeDasharray="none"
      />
      <path
        d="M 154,138 A 64,64 0 0,1 46,138"
        fill="none"
        stroke="#222222"
        strokeWidth="0.8"
        strokeDasharray="none"
      />

      {/* Top Text: UNLOCKING */}
      <text
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        fontSize="12.5"
        fontWeight="900"
        fill="#111111"
        letterSpacing="4"
      >
        <textPath href="#kmTopCurve" startOffset="50%" textAnchor="middle">
          UNLOCKING
        </textPath>
      </text>

      {/* Bottom Text: DREAMS TO YOUR DOOR */}
      <text
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        fontSize="10"
        fontWeight="900"
        fill="#111111"
        letterSpacing="2.8"
      >
        <textPath href="#kmBottomCurve" startOffset="50%" textAnchor="middle">
          DREAMS TO YOUR DOOR
        </textPath>
      </text>

      {/* CENTER HOUSE & ROOF ELEMENTS */}
      <g id="houseElements">
        {/* Olive-Gold Roof Gable with Chimney */}
        {/* Chimney */}
        <rect x="119" y="66" width="9" height="15" fill="#948b3c" rx="0.5" />
        {/* Main Roof Gable */}
        <path
          d="M 58,92 L 67,82 L 100,58 L 138,88 L 131,93 L 100,68 L 73,91 Z"
          fill="#948b3c"
        />

        {/* 4-Pane Attic Window */}
        <g transform="translate(93, 75)" fill="#948b3c">
          <rect x="0" y="0" width="6" height="6" rx="0.5" />
          <rect x="7.5" y="0" width="6" height="6" rx="0.5" />
          <rect x="0" y="7.5" width="6" height="6" rx="0.5" />
          <rect x="7.5" y="7.5" width="6" height="6" rx="0.5" />
        </g>

        {/* Green Leaf Accent on Roof */}
        <path
          d="M 98,59 C 103,46 116,47 121,52 C 123,60 115,69 98,71 C 97,66 95,62 98,59 Z"
          fill="#68bf42"
        />
        <path
          d="M 99,69 Q 108,58 118,52"
          stroke="#ffffff"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Bold Red KM Monogram */}
        <g filter="url(#kmDropShadow)">
          {/* 'K' Letter */}
          <path
            d="M 70,88 L 81,88 L 81,114 L 70,114 Z"
            fill="#cc1818"
          />
          <path
            d="M 80,98 L 94,88 L 98,94 L 88,103 L 99,114 L 89,114 L 81,105 Z"
            fill="#cc1818"
          />

          {/* 'M' Letter */}
          <path
            d="M 98,88 L 106,88 L 115,103 L 124,88 L 132,88 L 132,114 L 123,114 L 123,98 L 116,108 L 114,108 L 107,98 L 107,114 L 98,114 Z"
            fill="#cc1818"
          />
        </g>
      </g>
    </svg>
  );

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="relative shrink-0 rounded-full overflow-hidden shadow-xs border border-slate-300/40 bg-[#e5e7e8] flex items-center justify-center"
        style={{ width: pxSize, height: pxSize }}
      >
        {!imageError && logoAsset ? (
          <img
            src={logoAsset}
            alt="KM Real Estate Logo"
            className="w-full h-full object-cover rounded-full"
            onError={() => setImageError(true)}
          />
        ) : (
          renderSvgEmblem()
        )}
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`font-black text-sm sm:text-base tracking-tight leading-none truncate ${textColor}`}>
              KM REAL ESTATE
            </span>
          </div>
          <span className={`text-[10px] font-bold tracking-widest uppercase mt-0.5 truncate ${subtextColor}`}>
            Unlocking Dreams
          </span>
        </div>
      )}
    </div>
  );
};
