import React from 'react';

export interface ArcGeometricMarkProps {
  className?: string;
  size?: number;
}

/**
 * Interlocking ARC A-frame mark with Electric Indigo (#2B3BFF) arch brace and Tropical Mint (#35FEE4) apex node.
 * Engineered for pixel-crisp rendering on 2D Deep Obsidian canvas surfaces.
 */
export const ArcGeometricMark: React.FC<ArcGeometricMarkProps> = ({
  className = 'w-5 h-5',
  size,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Structural A-Frame Beams */}
      <path
        d="M16 6.5L6.5 25.5H10.8L16 14.8L21.2 25.5H25.5L16 6.5Z"
        fill="currentColor"
      />
      {/* Precision Interlocking Arch Cross-Brace (Electric Indigo) */}
      <path
        d="M9.8 20.2C11.6 18.4 13.8 17.5 16 17.5C18.2 17.5 20.4 18.4 22.2 20.2L20.8 21.8C19.4 20.4 17.7 19.6 16 19.6C14.3 19.6 12.6 20.4 11.2 21.8L9.8 20.2Z"
        fill="#2B3BFF"
      />
      {/* Precision Electric Indigo Apex Node with Tropical Mint Core */}
      <circle cx="16" cy="6.5" r="3.2" fill="#2B3BFF" />
      <circle cx="16" cy="6.5" r="1.3" fill="#35FEE4" />
    </svg>
  );
};
