export default function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden>
      <rect width="512" height="512" rx="116" fill="#1C1D22" />
      <g fill="none" stroke="#A1A1A6" strokeWidth="34" strokeLinecap="round">
        <path d="M168 176 C 248 176, 264 336, 344 336" />
        <path d="M168 176 L 92 170 M168 176 L 162 100 M344 336 L 420 342 M344 336 L 350 412" />
      </g>
      <g fill="#FFFFFF">
        <circle cx="168" cy="176" r="46" />
        <circle cx="344" cy="336" r="46" />
      </g>
    </svg>
  );
}
