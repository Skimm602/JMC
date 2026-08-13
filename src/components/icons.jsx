/**
 * Hand-rolled icon set — keeps the bundle free of an icon dependency and lets
 * every glyph share one stroke weight so the UI reads as a single system.
 */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

const Svg = ({ children, className = 'h-6 w-6', ...rest }) => (
  <svg {...base} {...rest} className={className}>
    {children}
  </svg>
)

export const BoltIcon = (p) => (
  <Svg {...p}>
    <path d="M13.5 3 6 14h5l-.75 7L18 10h-5.25z" />
  </Svg>
)

export const GridTieIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M7 20h10M12 16v4M7 8h4M7 11.5h2" />
  </Svg>
)

export const HybridIcon = (p) => (
  <Svg {...p}>
    <path d="M12 3v4M12 17v4" />
    <rect x="4" y="7" width="16" height="10" rx="2" />
    <path d="M9.5 10 8 12h2.2l-1 2.2L12 12H9.8z" />
  </Svg>
)

export const BatteryIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="7" width="16" height="10" rx="2" />
    <path d="M21 10.5v3M7 10.5v3M11 10.5v3M15 10.5v3" />
  </Svg>
)

export const MicroIcon = (p) => (
  <Svg {...p}>
    <rect x="5" y="5" width="14" height="14" rx="2" />
    <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
  </Svg>
)

export const MonitorIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M8 21h8M12 17v4M7 12l2.5-3 2 2.2L14 8l3 4" />
  </Svg>
)

export const ShieldIcon = (p) => (
  <Svg {...p}>
    <path d="M12 3 5 6v6c0 4 3 7.2 7 9 4-1.8 7-5 7-9V6z" />
    <path d="m9.2 12 2 2 3.6-3.8" />
  </Svg>
)

export const WrenchIcon = (p) => (
  <Svg {...p}>
    <path d="M15.5 3a5 5 0 0 0-4.4 7.3L3 18.4 5.6 21l8.1-8.1A5 5 0 0 0 21 8.5L18 11l-2.5-.5L15 8z" />
  </Svg>
)

export const HeadsetIcon = (p) => (
  <Svg {...p}>
    <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
    <rect x="2.5" y="13" width="4" height="6" rx="1.6" />
    <rect x="17.5" y="13" width="4" height="6" rx="1.6" />
    <path d="M19.5 19v.5a2.5 2.5 0 0 1-2.5 2.5h-3" />
  </Svg>
)

export const CheckIcon = (p) => (
  <Svg {...p}>
    <path d="m5 13 4 4L19 7" />
  </Svg>
)

export const ChevronDownIcon = (p) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
)

export const ArrowRightIcon = (p) => (
  <Svg {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </Svg>
)

/** Reads as "go somewhere" rather than "next" — used by the header CTA. */
export const ArrowUpRightIcon = (p) => (
  <Svg {...p}>
    <path d="M7 17 17 7M8.5 7H17v8.5" />
  </Svg>
)

export const UploadIcon = (p) => (
  <Svg {...p}>
    <path d="M12 16V4M8 8l4-4 4 4" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </Svg>
)

export const FileIcon = (p) => (
  <Svg {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </Svg>
)

export const XIcon = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
)

export const MenuIcon = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
)

export const InfoIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.75v.5" />
  </Svg>
)

export const AlertIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4.5M12 16.25v.5" />
  </Svg>
)

export const EyeIcon = (p) => (
  <Svg {...p}>
    <path d="M2.5 12S6.4 5.75 12 5.75 21.5 12 21.5 12 17.6 18.25 12 18.25 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3.1" />
  </Svg>
)

/**
 * The struck-through eye. The slash is drawn first so it sits under the rest
 * of the glyph at the crossings, which reads cleaner at 16px than a line laid
 * over the top of everything.
 */
export const EyeOffIcon = (p) => (
  <Svg {...p}>
    <path d="M3.5 3.5l17 17" />
    <path d="M10.6 6.05A9.7 9.7 0 0 1 12 5.75c5.6 0 9.5 6.25 9.5 6.25a16.4 16.4 0 0 1-3.55 4.15" />
    <path d="M6.6 7.95A16.2 16.2 0 0 0 2.5 12S6.4 18.25 12 18.25a9.9 9.9 0 0 0 3.4-.6" />
    <path d="M9.85 9.9a3.1 3.1 0 0 0 4.3 4.3" />
  </Svg>
)

export const SpinnerIcon = ({ className = 'h-5 w-5' }) => (
  <svg {...base} className={`${className} animate-spin`}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </svg>
)
