import { useEffect, useRef, useState } from 'react'
import { reducedMotion } from './motion'
import { DotField, Logo } from './ui'

/**
 * Landing page: one scroll-driven story. Light, royal blue + yellow brand.
 * Self-contained styles so the app's own design system (index.css) stays untouched.
 * Every animation has a static fallback under prefers-reduced-motion.
 */

const FAQ = [
  {
    q: 'Is it free?',
    a: 'Yes. RideRecord is free for riders and caregivers. It was built as a public-interest project for Michigan paratransit and Medicaid riders.',
  },
  {
    q: 'Who gets my complaint?',
    a: 'Only the office you choose to send it to. RideRecord drafts the complaint and shows you the right agency contact — you review it and you send it. Nothing is ever sent for you.',
  },
  {
    q: 'Can a caregiver log for me?',
    a: 'Yes. A family member, aide, or advocate can log rides and draft complaints on a rider’s behalf, with the rider’s permission.',
  },
  {
    q: 'Is my data private?',
    a: 'We ask you to leave street addresses and medical details out of your notes. Your record belongs to you, and we never sell or share rider data.',
  },
  {
    q: 'Does voice work?',
    a: 'Yes. If typing is hard, tap the microphone and just say what happened. RideRecord turns your words into a ride log you can check before saving.',
  },
] as const

const STEPS = [
  {
    title: 'Log the ride',
    body: 'Tap a few buttons or just say what happened. Ten seconds, right at the bus stop.',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true" className="lp-step-icon">
        <rect x="10" y="6" width="28" height="36" rx="4" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="M18 20l4 4 8-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="18" y1="32" x2="30" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'We draft the complaint',
    body: 'AI writes the complaint, finds the right agency, and counts the days left to file.',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true" className="lp-step-icon">
        <path d="M12 8h16l8 8v24H12z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M28 8v8h8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="18" y1="24" x2="30" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="18" y1="30" x2="30" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Track it — and the pattern',
    body: 'You follow your complaint to the deadline. Advocates see reliability trends across every ride.',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true" className="lp-step-icon">
        <path d="M8 40h32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="12" y="24" width="6" height="16" fill="currentColor" />
        <rect x="22" y="16" width="6" height="24" fill="currentColor" />
        <rect x="32" y="8" width="6" height="32" fill="currentColor" />
      </svg>
    ),
  },
] as const

const STATS = [
  { caption: 'Michigan riders depend on paratransit for work, dialysis, and groceries.' },
  { caption: 'of trips arrive late or not at all in some service regions.' },
  { caption: 'days is a typical filing window — miss it and the complaint dies.' },
] as const

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
/** How far p is through the stretch a..b, as 0..1. */
const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
const smooth = (t: number) => t * t * (3 - 2 * t)

const BEATS = [
  { until: 0.3, caption: 'The doctor’s appointment is at 9:00.' },
  { until: 0.6, caption: 'The ride was supposed to be here by now.' },
  { until: 0.85, caption: 'The van drives right past.' },
  { until: Infinity, caption: 'Another missed appointment. No one owns it.' },
] as const

/**
 * The scroll-driven story, from the pitch's hook: a rider in a powered wheelchair
 * waits for a Medicaid ride to a doctor's appointment. The van drives right past,
 * the appointment is missed — and no one owns it.
 *
 * Everything is drawn from one number, p (0..1 scroll progress), so the still
 * version for reduced motion is just a fixed p.
 */
function RideScene() {
  const track = useRef<HTMLDivElement>(null)
  // Reduced motion: a static midpoint, the van level with the rider and the clock near nine.
  const [p, setP] = useState(() => (reducedMotion() ? 0.6 : 0))

  useEffect(() => {
    if (reducedMotion()) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = track.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const scrollable = rect.height - window.innerHeight
        setP(scrollable > 0 ? clamp01(-rect.top / scrollable) : 0)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  const beat = BEATS.findIndex((b) => p < b.until)

  // Van: slows as it nears the rider, as if it will stop, then pulls away faster and faster.
  const vanIn = smooth(span(p, 0.3, 0.6))
  const vanPast = span(p, 0.6, 0.85) ** 2
  const vanX = -240 + vanIn * 430 + vanPast * 670
  const wheelSpin = (vanX / 14) * (180 / Math.PI)
  const rush = Math.sin(Math.sqrt(vanPast) * Math.PI) // speed lines: strongest mid-pass

  // Rider: waves as the van approaches, then the arm drops and the head sinks.
  const wave = vanIn * (1 - span(p, 0.66, 0.78))
  const armAngle = 55 - wave * 115 + wave * Math.sin(p * 90) * 12
  const droop = smooth(span(p, 0.72, 0.9))

  // Clock: 8:00 at the top of the scene, 9:00 exactly when the appointment is lost.
  const minutes = p * 70
  const late = minutes >= 60
  const time = `${late ? 9 : 8}:${String(Math.floor(minutes % 60)).padStart(2, '0')}`
  const missed = smooth(span(p, 0.85, 0.93))

  return (
    <div ref={track} className="lp-scene-track">
      <div className="lp-scene-sticky">
        <svg
          viewBox="0 0 800 330"
          role="img"
          aria-label="Illustration: a wheelchair rider waits outside their home for a ride to a doctor's appointment. The van drives past without stopping, and the appointment is missed."
          className="lp-scene-svg"
        >
          <defs>
            <linearGradient id="lp-sky-dawn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e5e5e5" />
              <stop offset="1" stopColor="#fafafa" />
            </linearGradient>
            <linearGradient id="lp-sky-day" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e5e5e5" />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
          </defs>

          {/* sky: dawn fading into full morning as the hour slips by */}
          <rect width="800" height="206" fill="url(#lp-sky-dawn)" />
          <rect width="800" height="206" fill="url(#lp-sky-day)" opacity={p} />
          <g transform={`translate(${120 + p * 180},${150 - Math.sin((p * Math.PI) / 2) * 105})`}>
            <circle r="22" fill="#fff" stroke="#0a0a0a" strokeWidth="3" />
          </g>
          <g fill="#fff" opacity="0.9" transform={`translate(${p * 50},0)`}>
            <path d="M150 62 a16 16 0 0 1 30 -8 a20 20 0 0 1 36 8 z" />
            <path d="M520 44 a14 14 0 0 1 26 -7 a18 18 0 0 1 32 7 z" />
          </g>
          {/* far skyline, drifting slower than the street for depth */}
          <g fill="#0a0a0a" opacity="0.08" transform={`translate(${-p * 24},0)`}>
            <rect x="170" y="130" width="46" height="76" />
            <rect x="222" y="104" width="34" height="102" />
            <rect x="330" y="140" width="60" height="66" />
            <rect x="500" y="116" width="40" height="90" />
            <rect x="546" y="146" width="52" height="60" />
          </g>

          {/* street */}
          <rect y="212" width="800" height="118" fill="#0a0a0a" />
          <rect y="200" width="800" height="12" fill="#d0d5dd" />
          <line x1="0" y1="310" x2="800" y2="310" stroke="#ffffff" strokeWidth="4" strokeDasharray="42 30" />

          {/* home: the window light goes out as the morning wears on */}
          <g>
            <rect x="36" y="118" width="112" height="82" fill="#fff" stroke="#0a0a0a" strokeWidth="3" />
            <path d="M24 120 L92 70 L160 120 Z" fill="#0a0a0a" />
            <rect x="52" y="136" width="30" height="26" fill="#e5e5e5" stroke="#0a0a0a" strokeWidth="2.5" />
            <rect x="52" y="136" width="30" height="26" fill="#ffffff" opacity={1 - p} />
            <rect x="102" y="150" width="30" height="50" fill="#0a0a0a" />
          </g>

          {/* clinic: door open, then shut once the appointment is missed */}
          <g>
            <rect x="620" y="92" width="150" height="108" fill="#fff" stroke="#0a0a0a" strokeWidth="3" />
            <rect x="612" y="78" width="166" height="18" rx="3" fill="#0a0a0a" />
            <rect x="684" y="112" width="22" height="8" rx="2" fill="#b42318" />
            <rect x="691" y="105" width="8" height="22" rx="2" fill="#b42318" />
            <rect x="634" y="140" width="30" height="26" fill="#e5e5e5" stroke="#0a0a0a" strokeWidth="2.5" />
            <rect x="726" y="140" width="30" height="26" fill="#e5e5e5" stroke="#0a0a0a" strokeWidth="2.5" />
            <rect x="678" y="146" width="34" height="54" fill="#0a0a0a" />
            <g opacity={missed}>
              <rect x="678" y="146" width="34" height="54" fill="#475467" />
              <path d="M687 164 l16 16 m0 -16 l-16 16" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
            </g>
          </g>

          {/* street clock: turns red at nine */}
          <g transform="translate(440,0)">
            <rect x="-3" y="104" width="6" height="96" fill="#0a0a0a" />
            <circle cy="72" r="34" fill="#fff" stroke={late ? '#b42318' : '#0a0a0a'} strokeWidth="4" />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
              <line key={a} y1={-28 + 72} y2={-24 + 72} stroke="#0a0a0a" strokeWidth="2" transform={`rotate(${a} 0 72)`} />
            ))}
            <line y1="72" y2="54" stroke="#0a0a0a" strokeWidth="4" strokeLinecap="round" transform={`rotate(${-120 + minutes / 2} 0 72)`} />
            <line y1="72" y2="46" stroke={late ? '#b42318' : '#0a0a0a'} strokeWidth="3" strokeLinecap="round" transform={`rotate(${minutes * 6} 0 72)`} />
            <circle cy="72" r="3.5" fill="#0a0a0a" />
            <rect x="-30" y="114" width="60" height="24" rx="5" fill={late ? '#b42318' : '#0a0a0a'} />
            <text y="131" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700" fontFamily="ui-monospace, Menlo, monospace">
              {time}
            </text>
          </g>

          {/* pickup sign */}
          <g>
            <rect x="308" y="136" width="4" height="64" fill="#0a0a0a" />
            <rect x="296" y="112" width="28" height="28" rx="4" fill="#0a0a0a" />
            <g transform="translate(309,126)" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round">
              <circle cy="-7" r="2.4" fill="#fff" stroke="none" />
              <path d="M0 -3 v6 h6" />
              <circle cx="1" cy="6" r="5" />
            </g>
          </g>

          {/* the rider, facing the way the ride should come from */}
          <g transform="translate(262,0) scale(-1,1)" stroke="#0a0a0a" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <circle cx="0" cy="178" r="22" strokeWidth="5" />
            <circle cx="32" cy="192" r="8" strokeWidth="4" />
            <path d="M-12 146 V174 H24 l8 12" strokeWidth="5" />
            <path d={`M-4 138 V170 H22 l6 16`} strokeWidth="7" />
            <line x1="-4" y1="146" x2="18" y2="146" strokeWidth="6" transform={`rotate(${armAngle} -4 146)`} />
            <circle cx={-4 + droop * 4} cy={122 + droop * 5} r="11" fill="#0a0a0a" stroke="none" />
          </g>

          {/* paratransit van */}
          <g transform={`translate(${vanX},${Math.sin(vanX / 9) * 1.2})`}>
            <ellipse cx="94" cy="296" rx="104" ry="5" fill="#000" opacity="0.3" />
            <g stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity={rush * 0.8}>
              <line x1="-18" y1="232" x2="-70" y2="232" />
              <line x1="-10" y1="250" x2="-90" y2="250" />
              <line x1="-18" y1="268" x2="-60" y2="268" />
            </g>
            <path d="M0 280 V226 a12 12 0 0 1 12 -12 H128 a12 12 0 0 1 10 6 L160 246 h18 a10 10 0 0 1 10 10 V280 Z" fill="#0a0a0a" stroke="#ffffff" strokeWidth="3" />
            <rect x="14" y="224" width="40" height="24" rx="4" fill="#e5e5e5" />
            <rect x="62" y="224" width="40" height="24" rx="4" fill="#e5e5e5" />
            <path d="M110 224 h17 l15 24 h-32 z" fill="#e5e5e5" />
            <rect x="0" y="270" width="188" height="5" fill="#ffffff" />
            <rect x="181" y="254" width="7" height="9" rx="2" fill="#ffffff" />
            <g transform="translate(82,259) scale(0.7)" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round">
              <circle cy="-8" r="3" fill="#fff" stroke="none" />
              <path d="M0 -4 v7 h7" />
              <circle cx="1" cy="9" r="6" />
            </g>
            {[40, 146].map((cx) => (
              <g key={cx} transform={`translate(${cx},282) rotate(${wheelSpin})`}>
                <circle r="14" fill="#0a0a0a" stroke="#475467" strokeWidth="2" />
                <path d="M-9 0 H9 M0 -9 V9" stroke="#98a2b3" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ))}
          </g>

          {/* the missed appointment, stamped on a calendar */}
          <g transform={`translate(560,56) rotate(${-8 * missed}) scale(${0.6 + 0.4 * missed})`} opacity={missed}>
            <rect x="-34" y="-28" width="68" height="62" rx="6" fill="#fff" stroke="#0a0a0a" strokeWidth="3" />
            <path d="M-34 -22 a6 6 0 0 1 6 -6 h56 a6 6 0 0 1 6 6 v10 h-68 z" fill="#0a0a0a" />
            <path d="M-13 0 L13 24 M13 0 L-13 24" stroke="#b42318" strokeWidth="5" strokeLinecap="round" />
          </g>
        </svg>

        <p className="lp-scene-caption" aria-live="polite">
          <span key={beat} className="fx-rise">{BEATS[beat]?.caption}</span>
        </p>
        <div className="lp-scene-dots" aria-hidden="true">
          {BEATS.map((b, i) => (
            <span key={b.caption} className={i === beat ? 'lp-on' : ''} />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Phone frame with a miniature of the app home screen, revealed on scroll. */
function AppReveal() {
  return (
    <div className="lp-phone-wrap">
      <div className="lp-phone" role="img" aria-label="Preview of the RideRecord home screen: a greeting, a Log a ride button, a Talk instead button, and recent complaints with status chips.">
        <p className="lp-phone-hi">Hi, Denise</p>
        <p className="lp-phone-sub">How was today&rsquo;s ride?</p>
        <span className="lp-phone-btn">Log a ride</span>
        <span className="lp-phone-btn2">Talk instead</span>
        <div className="lp-phone-row">
          <span>Modivcare · Nov 12</span>
          <span className="lp-chip lp-chip-pending">To file</span>
        </div>
        <div className="lp-phone-row">
          <span>SMART ADA · Nov 8</span>
          <span className="lp-chip lp-chip-filed">Filed</span>
        </div>
        <div className="lp-phone-row">
          <span>DDOT Now · Nov 4</span>
          <span className="lp-chip lp-chip-ok">On time</span>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="lp">
      <style>{`
        .lp {
          --blue: #0a0a0a;
          --blue-dark: #404040;
          --yellow: #ffffff;
          --ink: #0a0a0a;
          --muted: #525252;
          --paper: #ffffff;
          --wash: #f4f6fc;
          background: var(--paper);
          color: var(--ink);
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          line-height: 1.5;
        }
        .lp h1, .lp h2, .lp h3, .lp-display { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
        .lp a:focus-visible, .lp summary:focus-visible {
          outline: 3px solid var(--blue);
          outline-offset: 3px;
          border-radius: 4px;
        }
        .lp-wrap { max-width: 72rem; margin: 0 auto; padding: 0 1.5rem; }

        /* Header */
        .lp-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.5rem; max-width: 72rem; margin: 0 auto;
        }
        .lp-logo { display: flex; align-items: center; gap: 0.6rem; font-weight: 700; font-size: 1.25rem; color: var(--ink); text-decoration: none; }
        .lp-header-cta {
          display: inline-flex; align-items: center; min-height: 48px; padding: 0 1.25rem;
          background: var(--blue); color: #fff; font-weight: 600; border-radius: 0.625rem; text-decoration: none;
        }
        .lp-header-cta:hover { background: var(--blue-dark); }

        /* Hero */
        .lp-hero { padding: 4rem 0 2rem; text-align: center; position: relative; isolation: isolate; }
        .lp-hero h1 {
          font-size: clamp(2.5rem, 6vw, 4.25rem); font-weight: 700;
          letter-spacing: -0.03em; line-height: 1.02; margin: 0;
        }
        .lp-hero h1 .lp-muteword { color: var(--muted); }
        .lp-hero-sub {
          margin: 1.5rem auto 0; max-width: 36rem; font-size: 1.25rem; color: var(--muted);
        }
        .lp-cta {
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 56px; margin-top: 2rem; padding: 0 2.25rem;
          background: var(--blue); color: #fff; font-size: 1.125rem; font-weight: 700;
          border-radius: 0.75rem; text-decoration: none;
        }
        .lp-cta:hover { background: var(--blue-dark); }

        /* Scroll scene */
        .lp-scene-track { height: 280vh; }
        .lp-scene-sticky {
          position: sticky; top: 0; min-height: 100dvh;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 2rem 1rem;
        }
        .lp-scene-svg {
          width: min(100%, 60rem); height: auto; border-radius: 1.5rem;
          box-shadow: 0 30px 60px -30px rgba(16,24,40,0.45);
        }
        .lp-scene-caption span { display: inline-block; }
        .lp-scene-dots { display: flex; gap: 0.5rem; margin-top: 1rem; }
        .lp-scene-dots span {
          width: 0.5rem; height: 0.5rem; border-radius: 999px; background: #d0d5dd;
          transition: width var(--dur-2) var(--ease-swift), background var(--dur-2) ease;
        }
        .lp-scene-dots .lp-on { width: 1.75rem; background: var(--blue); }
        .lp-scene-caption {
          margin-top: 1.5rem; text-align: center; font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          font-size: 1.375rem; font-weight: 600; color: var(--ink);
        }

        /* App reveal */
        .lp-reveal { background: var(--wash); padding: 6rem 0; }
        .lp-reveal-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;
        }
        @media (max-width: 860px) { .lp-reveal-grid { grid-template-columns: 1fr; } }
        .lp-reveal h2 { font-size: clamp(1.875rem, 4vw, 2.75rem); letter-spacing: -0.02em; line-height: 1.1; margin: 0 0 1rem; }
        .lp-reveal p { color: var(--muted); font-size: 1.125rem; margin: 0; }
        .lp-phone-wrap { display: flex; justify-content: center; }
        .lp-phone {
          width: min(100%, 20rem); background: var(--frost); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border: 3px solid var(--ink);
          border-radius: 2rem; padding: 2rem 1.5rem; box-shadow: 0 24px 48px -20px rgba(16,24,40,0.25);
        }
        .lp-phone-hi { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; font-size: 1.5rem; font-weight: 700; margin: 0; color: var(--ink); }
        .lp-phone-sub { color: var(--muted); margin: 0.25rem 0 1.25rem; font-size: 0.9375rem; }
        .lp-phone-btn, .lp-phone-btn2 {
          display: flex; align-items: center; justify-content: center; min-height: 52px;
          border-radius: 0.75rem; font-weight: 700; margin-bottom: 0.75rem;
        }
        .lp-phone-btn { background: var(--blue); color: #fff; }
        .lp-phone-btn2 { border: 2px solid var(--blue); color: var(--blue); }
        .lp-phone-row {
          display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
          border-top: 1px solid #e4e7ec; padding: 0.75rem 0.25rem 0; margin-top: 0.75rem;
          font-size: 0.875rem; color: var(--ink);
        }
        .lp-chip { font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; white-space: nowrap; }
        .lp-chip-pending { background: #fef3c7; color: #92400e; }
        .lp-chip-filed { background: #dbe4ff; color: var(--blue); }
        .lp-chip-ok { background: #dcfae6; color: #067647; }

        /* Sections */
        .lp-section { padding: 6rem 0; }
        .lp-section h2 { font-size: clamp(1.875rem, 4vw, 2.75rem); letter-spacing: -0.02em; line-height: 1.1; margin: 0 0 0.75rem; }
        .lp-section-lead { color: var(--muted); font-size: 1.125rem; margin: 0 0 3rem; max-width: 40rem; }

        .lp-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; list-style: none; padding: 0; margin: 0; }
        @media (max-width: 860px) { .lp-steps { grid-template-columns: 1fr; } }
        .lp-step { border: 1px solid #e4e7ec; border-radius: 1rem; padding: 2rem; }
        .lp-step-icon { width: 48px; height: 48px; color: var(--blue); }
        .lp-step h3 { font-size: 1.25rem; margin: 1.25rem 0 0.5rem; }
        .lp-step p { color: var(--muted); margin: 0; }
        .lp-step-num { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; font-weight: 700; color: var(--blue); font-size: 0.875rem; letter-spacing: 0.12em; }

        .lp-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; list-style: none; padding: 0; margin: 0; }
        @media (max-width: 860px) { .lp-stats { grid-template-columns: 1fr; } }
        .lp-stat { background: var(--wash); border-radius: 1rem; padding: 2rem; }
        .lp-stat-num {
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; font-size: 3.5rem; font-weight: 700;
          color: var(--blue); line-height: 1; letter-spacing: -0.02em;
        }
        .lp-stat p { color: var(--muted); margin: 1rem 0 0; }
        .lp-stats-note { margin-top: 1.5rem; font-size: 0.875rem; color: var(--muted); }

        /* FAQ */
        .lp-faq { max-width: 48rem; }
        .lp-faq details { border-bottom: 1px solid #e4e7ec; }
        .lp-faq summary {
          cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between;
          gap: 1rem; min-height: 56px; padding: 1rem 0; font-weight: 600; font-size: 1.125rem;
        }
        .lp-faq summary::-webkit-details-marker { display: none; }
        .lp-faq summary::after { content: "+"; font-size: 1.5rem; color: var(--blue); flex: none; }
        .lp-faq details[open] summary::after { content: "−"; }
        .lp-faq details p { color: var(--muted); margin: 0 0 1.25rem; max-width: 40rem; }

        /* CTA band + footer */
        .lp-band { background: var(--blue); color: #fff; padding: 5rem 0; text-align: center; }
        .lp-band h2 { font-size: clamp(1.875rem, 4vw, 2.75rem); letter-spacing: -0.02em; margin: 0 0 1rem; }
        .lp-band p { color: #dbe4ff; font-size: 1.125rem; margin: 0 0 2rem; }
        .lp-band-cta {
          display: inline-flex; align-items: center; justify-content: center; min-height: 56px;
          padding: 0 2.25rem; background: var(--yellow); color: var(--ink);
          font-size: 1.125rem; font-weight: 700; border-radius: 0.75rem; text-decoration: none;
        }
        .lp-band-cta:hover { filter: brightness(1.05); }
        .lp a.lp-band-cta:focus-visible { outline-color: var(--yellow); }
        .lp-footer { border-top: 1px solid #e4e7ec; padding: 2rem 0; }
        .lp-footer-inner {
          display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem;
          font-size: 0.875rem; color: var(--muted);
        }
        .lp-footer nav { display: flex; gap: 1.5rem; }
        .lp-footer a { color: var(--blue); text-decoration: none; font-weight: 600; }
        .lp-footer a:hover { text-decoration: underline; }

        /* ---- Monochrome look: black on white, one typeface, big tight type ---- */
        html { scroll-padding-bottom: 6rem; } /* keep focused things clear of the floating bar */
        .lp > main, .lp > footer { position: relative; z-index: 1; }

        /* floating bar, bottom centre */
        .lp-pill {
          position: fixed; left: 50%; translate: -50% 0; bottom: max(1.5rem, env(safe-area-inset-bottom)); z-index: 50;
          display: flex; align-items: center; gap: 1.5rem; padding: 0.5rem 0.5rem 0.5rem 0.75rem;
          background: color-mix(in srgb, var(--ink) 86%, transparent); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
          border-radius: 0.3rem; white-space: nowrap;
        }
        .lp-pill .lp-logo { color: #fff; }
        .lp-pill .lp-logo > span { background: #fff; color: var(--ink); }
        .lp-pill .lp-header-cta { background: #fff; color: var(--ink); border-radius: 0.2rem; }
        .lp-pill .lp-header-cta:hover { background: #d4d4d4; }
        .lp .lp-pill a:focus-visible { outline-color: #fff; }

        /* hero: the headline sits in black label blocks */
        .lp-hero { min-height: 82dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 0; }
        .lp-hero h1 { font-weight: 600; line-height: 1.1; }
        .lp-label { display: inline-block; background: color-mix(in srgb, var(--ink) 86%, transparent); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); color: #fff; padding: 0.08em 0.3em 0.14em; border-radius: 0.3rem; margin: 0.06em 0; }
        .lp-hero h1 .lp-muteword { color: #a3a3a3; }
        .lp-hero-sub { color: var(--ink); font-weight: 600; font-size: clamp(1.25rem, 2.4vw, 1.75rem); line-height: 1.15; letter-spacing: -0.02em; }
        .lp-cta, .lp-step, .lp-stat { border-radius: 0.3rem; }

        /* sections: very large headings, rows split by black rules */
        .lp-section h2, .lp-reveal h2, .lp-band h2 { font-size: clamp(2.5rem, 7vw, 4.5rem); font-weight: 600; letter-spacing: -0.04em; line-height: 0.98; }
        .lp-section-lead, .lp-reveal p { color: var(--ink); font-weight: 600; font-size: clamp(1.25rem, 2.4vw, 1.75rem); line-height: 1.15; letter-spacing: -0.02em; }
        .lp-steps, .lp-stats { display: block; }
        .lp-step, .lp-stat { background: none; border: 0; border-top: 1px solid var(--ink); border-radius: 0; padding: 1.5rem 0; }
        .lp-step { display: grid; grid-template-columns: 7rem 1fr; column-gap: 1.5rem; align-items: start; }
        .lp-step > div { grid-column: 1; grid-row: 1 / span 3; }
        .lp-step > :not(div) { grid-column: 2; }
        .lp-step h3 { margin: 0; font-size: clamp(1.75rem, 4.5vw, 3rem); font-weight: 600; letter-spacing: -0.03em; line-height: 1; }
        .lp-step p, .lp-stat p { font-size: 1.125rem; margin-top: 0.5rem; }
        @media (max-width: 640px) { .lp-step { grid-template-columns: 1fr; } .lp-step > * { grid-column: 1; grid-row: auto; } }
        .lp-faq { max-width: none; }
        .lp-faq details { border-bottom-color: var(--ink); }
        .lp-faq summary { font-size: clamp(1.25rem, 3vw, 2rem); letter-spacing: -0.02em; }
        .lp-reveal { background: none; }
        .lp-chip-filed { background: #e5e5e5; }

        /* closing panel: an inset black slab */
        .lp-band { margin: 0 1.5rem 1.5rem; border-radius: 0.3rem; min-height: 80dvh; display: flex; align-items: center; text-align: left; }
        .lp-band p { color: #d4d4d4; font-size: 1.25rem; }
        .lp-band-cta { border-radius: 0.3rem; }
        .lp-footer { border-top: 0; padding: 2rem 0 7rem; }

        /* Motion: everything animated only when motion is welcome */
        @media (prefers-reduced-motion: no-preference) {
          .lp-header-cta { transition: background 150ms ease; }
          .lp-band-cta { transition: translate var(--dur-1) var(--ease-swift), box-shadow var(--dur-1) var(--ease-swift), filter var(--dur-1) ease; }
          /* Reveal on scroll. Browsers without scroll timelines just show the content. */
          @supports (animation-timeline: view()) {
            .lp-phone-wrap, .lp-step, .lp-stat {
              animation: rise linear both;
              animation-timeline: view();
              animation-range: entry 10% cover 30%;
            }
          }
          /* FAQ opens smoothly where supported, instantly elsewhere. */
          .lp-faq { interpolate-size: allow-keywords; }
          .lp-faq details::details-content {
            height: 0; overflow: clip;
            transition: height var(--dur-2) var(--ease-swift), content-visibility var(--dur-2) allow-discrete;
          }
          .lp-faq details[open]::details-content { height: auto; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lp-scene-track { height: auto; }
          .lp-scene-sticky { position: static; min-height: 0; }
        }
      `}</style>

      <DotField />
      <header className="lp-pill">
        <a href="#top" className="lp-logo lp-display">
          <Logo />
          RideRecord
        </a>
        <a href="#app" className="lp-header-cta">
          Log a ride
        </a>
      </header>

      <main id="top">
        {/* 1. Hero + scroll-driven bus scene */}
        <section className="lp-hero lp-wrap" aria-labelledby="lp-hero-h">
          <h1 id="lp-hero-h" className="fx-rise">
            <span className="lp-label">The appointment was at nine.</span>
            <br />
            <span className="lp-label">
              The ride <span className="lp-muteword">never came.</span>
            </span>
          </h1>
          <p className="lp-hero-sub fx-rise" style={{ ['--i' as string]: 2 }}>
            Log it in seconds. We&rsquo;ll draft the complaint and send it to the right place.
          </p>
          <a href="#app" className="lp-cta fx-rise fx-lift" style={{ ['--i' as string]: 4 }}>
            Log a ride
          </a>
        </section>

        <RideScene />

        {/* 2. App reveal */}
        <section className="lp-reveal" aria-labelledby="lp-reveal-h">
          <div className="lp-wrap lp-reveal-grid">
            <div>
              <h2 id="lp-reveal-h">Your own record of every ride</h2>
              <p>
                When a trip goes wrong, you leave with proof — the date, the route, what happened, and
                exactly where to send it.
              </p>
            </div>
            <AppReveal />
          </div>
        </section>

        {/* 3. How it works */}
        <section className="lp-section lp-wrap" aria-labelledby="lp-how-h">
          <h2 id="lp-how-h">How it works</h2>
          <p className="lp-section-lead">Three steps between a failed ride and a filed complaint.</p>
          <ol className="lp-steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="lp-step">
                <span className="lp-step-num">STEP {i + 1}</span>
                <div>{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 4. Why it matters */}
        <section className="lp-section lp-wrap" aria-labelledby="lp-why-h">
          <h2 id="lp-why-h">Why it matters</h2>
          <p className="lp-section-lead">
            Paratransit isn&rsquo;t a convenience. For thousands of Michigan riders, it&rsquo;s the only way
            there.
          </p>
          <ul className="lp-stats">
            {STATS.map((s) => (
              <li key={s.caption} className="lp-stat">
                <span className="lp-stat-num">—</span>
                <p>{s.caption}</p>
              </li>
            ))}
          </ul>
          <p className="lp-stats-note">
            Placeholder figures — real sourced numbers are being verified and will replace these.
          </p>
        </section>

        {/* 5. FAQ */}
        <section className="lp-section lp-wrap" aria-labelledby="lp-faq-h">
          <h2 id="lp-faq-h">Questions, answered</h2>
          <div className="lp-faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 6. Final CTA band */}
        <section className="lp-band" aria-labelledby="lp-band-h">
          <div className="lp-wrap">
            <h2 id="lp-band-h">Next time the ride doesn&rsquo;t show, be ready.</h2>
            <p>Ten seconds now means a complaint that lands before the deadline.</p>
            <a href="#app" className="lp-band-cta fx-lift">
              Log a ride
            </a>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-inner">
          <span>Built with IBM watsonx</span>
          <nav aria-label="Footer">
            <a href="#app">Log a ride</a>
            <a href="#top">Back to top</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
