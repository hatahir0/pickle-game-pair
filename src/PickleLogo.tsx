export default function PickleLogo({ size = 72 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 80 60"
      width={size}
      height={(size * 60) / 80}
      role="img"
      aria-label="pickleball paddle and ball"
    >
      <g transform="rotate(-25 32 28)">
        <rect x="18" y="6" width="28" height="34" rx="13" fill="#1D9E75" />
        <rect x="29" y="38" width="6" height="16" rx="3" fill="#085041" />
      </g>
      <circle cx="58" cy="42" r="11" fill="#C7E94F" />
      <circle cx="54" cy="39" r="1.8" fill="#639922" />
      <circle cx="61" cy="38" r="1.8" fill="#639922" />
      <circle cx="58" cy="45" r="1.8" fill="#639922" />
      <circle cx="63" cy="44" r="1.8" fill="#639922" />
    </svg>
  )
}
