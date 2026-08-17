import { cx } from './ui.jsx'

/**
 * The assistant's mascot. Idle floats gently and blinks now and then;
 * "thinking" switches to a quicker bob with a brighter, faster-pulsing
 * antenna, so the same glyph reads as "here" versus "working on it" without
 * a separate spinner next to it.
 */
export default function RobotMascot({ state = 'idle', className = 'h-6 w-6' }) {
  const thinking = state === 'thinking'

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cx(className, thinking ? 'animate-robot-float-fast' : 'animate-robot-idle')}
    >
      {/* antenna */}
      <path d="M16 8V5" />
      <circle
        cx="16"
        cy="3.6"
        r="1.5"
        fill="currentColor"
        stroke="none"
        className={thinking ? 'animate-robot-antenna-fast' : 'animate-robot-antenna'}
      />

      {/* head */}
      <rect x="6" y="8" width="20" height="16" rx="5" />

      {/* ears */}
      <path d="M6 13.5H3.2M28.8 13.5H26" />

      {/* eyes */}
      <circle cx="12.5" cy="16" r="1.7" fill="currentColor" stroke="none" className="animate-robot-blink" />
      <circle cx="19.5" cy="16" r="1.7" fill="currentColor" stroke="none" className="animate-robot-blink" />

      {/* mouth */}
      <path d="M12.5 20.5h7" />
    </svg>
  )
}
