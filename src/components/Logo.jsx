export default function Logo({ className = '', compact = false }) {
  return (
    <a href="#top" className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[10px] bg-gradient-to-br from-ink-700 to-ink-850 ring-1 ring-ink-600 transition-shadow duration-300 group-hover:shadow-[0_0_20px_-4px_rgba(255,176,32,0.6)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path d="M13.8 2.5 6.4 14.2h4.9l-.8 7.3 7.6-12.2h-5.1z" fill="var(--color-solar-500)" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-lg font-bold tracking-tight text-chalk">JMC</span>
          <span className="block font-mono text-[9px] tracking-[0.28em] text-mute-dim uppercase">Solar</span>
        </span>
      )}
      <span className="sr-only">JMC Solar — home</span>
    </a>
  )
}
