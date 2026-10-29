export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1C1C1E" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#logo-g)" />
      <rect x="128" y="132" width="210" height="270" rx="36" fill="#FFFFFF" opacity="0.35" transform="rotate(-12 233 267)" />
      <rect x="174" y="112" width="210" height="270" rx="36" fill="#FFFFFF" transform="rotate(6 279 247)" />
      <g transform="rotate(6 279 247)" fill="#000000">
        <rect x="261" y="160" width="36" height="120" rx="18" />
        <circle cx="279" cy="322" r="21" />
      </g>
    </svg>
  );
}
