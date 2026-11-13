import { useEffect, useRef, useState } from 'react'

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

/**
 * The scroll-driven story, from the pitch's hook: a rider in a powered wheelchair
 * waits for a Medicaid ride to a doctor's appointment. The van drives right past,
 * the appointment is missed — and no one owns it.
 */
function RideScene() {
  const track = useRef<HTMLDivElement>(null)
  const [p, setP] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setP(0.6) // static midpoint: the van passing by, the clock already past nine
      return
    }
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = track.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const scrollable = rect.height - window.innerHeight
        const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0
        setP(progress)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  // Phases: 0–0.3 waiting, 0.3–0.6 the van approaches, 0.6–0.85 it drives past, 0.85–1 missed.
  const vanIn = Math.min(1, Math.max(0, (p - 0.3) / 0.3))
  const vanPast = Math.min(1, Math.max(0, (p - 0.6) / 0.25))
  const vanX = -520 + vanIn * 480 + vanPast * 620 // px: off-screen left → beside the rider → off-screen right
  const missed = p >= 0.85
  // Clock hands sweep from 8:00 to past 9:00 across the whole scene.
  const minuteAngle = p * 420 // a little over one full hour of sweep
  const hourAngle = -120 + p * 45

  const caption =
    p < 0.3
      ? 'The doctor’s appointment is at 9:00.'
      : p < 0.6
        ? 'The ride was supposed to be here by now.'
        : p < 0.85
          ? 'The van drives right past.'
          : 'Another missed appointment. No one owns it.'

  return (
    <div ref={track} className="lp-scene-track">
      <div className="lp-scene-sticky">
        <svg
          viewBox="0 0 800 300"
          role="img"
          aria-label="Illustration: a wheelchair rider waits outside their home for a ride to a doctor's appointment. The van drives past without stopping, and the appointment is missed."
          className="lp-scene-svg"
        >
          {/* ground */}
          <line x1="0" y1="250" x2="800" y2="250" stroke="#101828" strokeWidth="3" />
          {/* home */}
          <g>
            <rect x="40" y="150" width="110" height="100" fill="#e4e7ec" />
            <path d="M30 150 L95 104 L160 150 Z" fill="#101828" />
            <rect x="80" y="200" width="30" height="50" fill="#1E40AF" />
          </g>
          {/* clinic */}
          <g>
            <rect x="640" y="130" width="130" height="120" fill="#e4e7ec" />
            <rect x="640" y="112" width="130" height="18" fill="#101828" />
            <rect x="686" y="146" width="38" height="14" rx="2" fill="#b42318" />
            <rect x="698" y="134" width="14" height="38" rx="2" fill="#b42318" />
            {/* clinic door: open, then closed once the appointment is missed */}
            <rect x="688" y="196" width="34" height="54" fill={missed ? '#475467' : '#1E40AF'} />
            {missed && (
              <g transform="translate(705,223)">
                <path d="M-9 -9 L9 9 M9 -9 L-9 9" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
              </g>
            )}
          </g>
          {/* clock: the appointment time slipping by */}
          <g transform="translate(400,74)">
            <circle r="30" fill="#fff" stroke="#101828" strokeWidth="3" />
            <line x1="0" y1="0" x2="0" y2="-18" stroke="#101828" strokeWidth="3" strokeLinecap="round" transform={`rotate(${hourAngle})`} />
            <line x1="0" y1="0" x2="0" y2="-24" stroke="#1E40AF" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${minuteAngle})`} />
            <circle r="3" fill="#101828" />
          </g>
          {/* wheelchair rider, waiting outside home */}
          <g transform="translate(230,0)">
            <circle cx="0" cy="158" r="12" fill="#101828" />
            <path d="M0 172 v36 h26" fill="none" stroke="#101828" strokeWidth="6" strokeLinecap="round" />
            <circle cx="6" cy="228" r="20" fill="none" stroke="#101828" strokeWidth="5" />
            <circle cx="34" cy="240" r="8" fill="none" stroke="#101828" strokeWidth="4" />
          </g>
          {/* paratransit van with accessibility symbol */}
          <g transform={`translate(${vanX},0)`}>
            <path d="M300 250 v-96 a12 12 0 0 1 12 -12 h118 a12 12 0 0 1 12 12 v22 l26 26 v48 z" fill="#1E40AF" />
            <rect x="316" y="158" width="44" height="34" rx="4" fill="#dbe4ff" />
            <rect x="370" y="158" width="44" height="34" rx="4" fill="#dbe4ff" />
            <path d="M446 158 h18 l20 20 v14 h-38 z" fill="#dbe4ff" />
            <rect x="316" y="204" width="152" height="9" rx="4.5" fill="#FACC15" />
            {/* wheelchair symbol on the van door */}
            <g transform="translate(392,176)" stroke="#1E40AF" strokeWidth="2.5" fill="none" strokeLinecap="round">
              <circle cx="0" cy="-8" r="3" fill="#1E40AF" stroke="none" />
              <path d="M0 -4 v7 h7" />
              <circle cx="1" cy="9" r="6" />
            </g>
            <circle cx="336" cy="250" r="16" fill="#101828" />
            <circle cx="440" cy="250" r="16" fill="#101828" />
          </g>
          {/* the missed appointment, marked on a calendar */}
          {missed && (
            <g transform="translate(520,60)">
              <rect x="-34" y="-26" width="68" height="60" rx="6" fill="#fff" stroke="#101828" strokeWidth="3" />
              <rect x="-34" y="-26" width="68" height="16" rx="6" fill="#1E40AF" />
              <path d="M-14 2 L14 26 M14 2 L-14 26" stroke="#b42318" strokeWidth="5" strokeLinecap="round" />
            </g>
          )}
        </svg>
        <p className="lp-scene-caption" aria-live="polite">
          {caption}
        </p>
      </div>
    </div>
  )
}

/** Phone frame with a miniature of the app home screen, revealed on scroll. */
function AppReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => entry?.isIntersecting && setShown(true),
      { threshold: 0.35 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`lp-phone-wrap ${shown ? 'lp-shown' : ''}`}>
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
          --blue: #1E40AF;
          --blue-dark: #16307f;
          --yellow: #FACC15;
          --ink: #101828;
          --muted: #475467;
          --paper: #ffffff;
          --wash: #f4f6fc;
          background: var(--paper);
          color: var(--ink);
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          line-height: 1.5;
        }
        .lp h1, .lp h2, .lp h3, .lp-display { font-family: 'Space Grotesk', 'Inter', ui-sans-serif, sans-serif; }
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
        .lp-logo { display: flex; align-items: center; gap: 0.6rem; font-weight: 700; font-size: 1.125rem; color: var(--ink); text-decoration: none; }
        .lp-header-cta {
          display: inline-flex; align-items: center; min-height: 48px; padding: 0 1.25rem;
          background: var(--blue); color: #fff; font-weight: 600; border-radius: 0.625rem; text-decoration: none;
        }
        .lp-header-cta:hover { background: var(--blue-dark); }

        /* Hero */
        .lp-hero { padding: 4rem 0 2rem; text-align: center; }
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
        .lp-scene-svg { width: min(100%, 52rem); height: auto; }
        .lp-scene-caption {
          margin-top: 1.5rem; font-family: 'Space Grotesk', sans-serif;
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
          width: min(100%, 20rem); background: #fff; border: 3px solid var(--ink);
          border-radius: 2rem; padding: 2rem 1.5rem; box-shadow: 0 24px 48px -20px rgba(16,24,40,0.25);
        }
        .lp-phone-hi { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; margin: 0; color: var(--ink); }
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
        .lp-step-num { font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: var(--blue); font-size: 0.875rem; letter-spacing: 0.12em; }

        .lp-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; list-style: none; padding: 0; margin: 0; }
        @media (max-width: 860px) { .lp-stats { grid-template-columns: 1fr; } }
        .lp-stat { background: var(--wash); border-radius: 1rem; padding: 2rem; }
        .lp-stat-num {
          font-family: 'Space Grotesk', sans-serif; font-size: 3.5rem; font-weight: 700;
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
        .lp-band-cta:focus-visible { outline-color: var(--yellow); }
        .lp-footer { border-top: 1px solid #e4e7ec; padding: 2rem 0; }
        .lp-footer-inner {
          display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem;
          font-size: 0.875rem; color: var(--muted);
        }
        .lp-footer nav { display: flex; gap: 1.5rem; }
        .lp-footer a { color: var(--blue); text-decoration: none; font-weight: 600; }
        .lp-footer a:hover { text-decoration: underline; }

        /* Motion: everything animated only when motion is welcome */
        @media (prefers-reduced-motion: no-preference) {
          .lp-phone-wrap { opacity: 0; transform: translateY(3rem); transition: opacity 600ms ease, transform 600ms ease; }
          .lp-phone-wrap.lp-shown { opacity: 1; transform: none; }
          .lp-cta, .lp-header-cta, .lp-band-cta { transition: background 150ms ease, filter 150ms ease; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lp-scene-track { height: auto; }
          .lp-scene-sticky { position: static; min-height: 0; }
        }
      `}</style>

      <header className="lp-header">
        <a href="#top" className="lp-logo">
          {/* Minimal wolverine-riding-a-bus mark */}
          <svg width="34" height="34" viewBox="0 0 48 48" aria-hidden="true">
            <rect x="4" y="16" width="40" height="20" rx="5" fill="#101828" />
            <rect x="9" y="21" width="9" height="7" rx="1.5" fill="#fff" />
            <rect x="21" y="21" width="9" height="7" rx="1.5" fill="#fff" />
            <circle cx="14" cy="38" r="4" fill="#101828" />
            <circle cx="34" cy="38" r="4" fill="#101828" />
            <path d="M20 14c2-5 6-7 9-6-1 2-1 4 1 5-2 1-4 1-6 0-1 1-3 2-4 1z" fill="#101828" />
          </svg>
          RideRecord
        </a>
        <a href="#app" className="lp-header-cta">
          Log a ride
        </a>
      </header>

      <main id="top">
        {/* 1. Hero + scroll-driven bus scene */}
        <section className="lp-hero lp-wrap" aria-labelledby="lp-hero-h">
          <h1 id="lp-hero-h">
            The appointment was at nine.
            <br />
            The ride <span className="lp-muteword">never came.</span>
          </h1>
          <p className="lp-hero-sub">
            Log it in seconds. We&rsquo;ll draft the complaint and send it to the right place.
          </p>
          <a href="#app" className="lp-cta">
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
            <a href="#app" className="lp-band-cta">
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
