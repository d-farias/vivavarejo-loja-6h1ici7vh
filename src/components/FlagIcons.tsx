import React from 'react'

export interface FlagProps {
  className?: string
  title?: string
}

/**
 * Bandeira do Brasil (compacta, nítida, vetor SVG soberano)
 */
export function FlagBrazil({ className = 'w-5 h-3.5', title = 'Português (Brasil)' }: FlagProps) {
  return (
    <svg
      viewBox="0 0 720 504"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <title>{title}</title>
      <rect width="720" height="504" fill="#009b3a" rx="36" />
      <polygon points="360,60 660,252 360,444 60,252" fill="#fedf00" />
      <circle cx="360" cy="252" r="126" fill="#002776" />
      <path d="M 234 260 A 136 136 0 0 1 486 250" stroke="#ffffff" strokeWidth="16" fill="none" />
    </svg>
  )
}

/**
 * Bandeira dos Estados Unidos (compacta, nítida, vetor SVG soberano)
 */
export function FlagUSA({ className = 'w-5 h-3.5', title = 'English (United States)' }: FlagProps) {
  return (
    <svg
      viewBox="0 0 720 504"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <title>{title}</title>
      <defs>
        <clipPath id="us-rounded">
          <rect width="720" height="504" rx="36" />
        </clipPath>
      </defs>
      <g clipPath="url(#us-rounded)">
        {/* Fundo branco */}
        <rect width="720" height="504" fill="#ffffff" />
        {/* 7 listras vermelhas de 13 listras */}
        <rect y="0" width="720" height="38.77" fill="#b22234" />
        <rect y="77.54" width="720" height="38.77" fill="#b22234" />
        <rect y="155.08" width="720" height="38.77" fill="#b22234" />
        <rect y="232.62" width="720" height="38.77" fill="#b22234" />
        <rect y="310.15" width="720" height="38.77" fill="#b22234" />
        <rect y="387.69" width="720" height="38.77" fill="#b22234" />
        <rect y="465.23" width="720" height="38.77" fill="#b22234" />
        {/* Cantão azul */}
        <rect width="288" height="271.38" fill="#3c3b6e" />
        {/* Grade de estrelas estilizada e nítida */}
        <g fill="#ffffff" opacity="0.95">
          <circle cx="36" cy="30" r="7" />
          <circle cx="96" cy="30" r="7" />
          <circle cx="156" cy="30" r="7" />
          <circle cx="216" cy="30" r="7" />
          <circle cx="270" cy="30" r="7" />

          <circle cx="66" cy="65" r="7" />
          <circle cx="126" cy="65" r="7" />
          <circle cx="186" cy="65" r="7" />
          <circle cx="246" cy="65" r="7" />

          <circle cx="36" cy="100" r="7" />
          <circle cx="96" cy="100" r="7" />
          <circle cx="156" cy="100" r="7" />
          <circle cx="216" cy="100" r="7" />
          <circle cx="270" cy="100" r="7" />

          <circle cx="66" cy="135" r="7" />
          <circle cx="126" cy="135" r="7" />
          <circle cx="186" cy="135" r="7" />
          <circle cx="246" cy="135" r="7" />

          <circle cx="36" cy="170" r="7" />
          <circle cx="96" cy="170" r="7" />
          <circle cx="156" cy="170" r="7" />
          <circle cx="216" cy="170" r="7" />
          <circle cx="270" cy="170" r="7" />

          <circle cx="66" cy="205" r="7" />
          <circle cx="126" cy="205" r="7" />
          <circle cx="186" cy="205" r="7" />
          <circle cx="246" cy="205" r="7" />

          <circle cx="36" cy="240" r="7" />
          <circle cx="96" cy="240" r="7" />
          <circle cx="156" cy="240" r="7" />
          <circle cx="216" cy="240" r="7" />
          <circle cx="270" cy="240" r="7" />
        </g>
      </g>
    </svg>
  )
}
