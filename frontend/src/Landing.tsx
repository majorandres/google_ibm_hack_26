import { useEffect, useRef, useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import Story from './Story'

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

// Each figure says only what its source says; the sources are listed under the tiles.
const STATS = [
  { num: '30,912', caption: 'paratransit trips in Detroit in a single month (August 2025).' },
  {
    num: '35%',
    caption: 'of Medicaid ride pickups in Metro Detroit fell outside the allowed time window in one state review. The contract allowed 15%.',
  },
  { num: '180', caption: 'days to file an ADA complaint with DDOT. After that, it won’t be investigated.' },
] as const

/** WebGL 2 is what three.js needs; checked before its chunk is downloaded. */
function hasWebGL() {
  const gl = document.createElement('canvas').getContext('webgl2')
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
  return gl !== null
}

/**
 * Phone frame with a miniature of the app home screen, revealed on scroll.
 * With WebGL a 3D phone (three/phone.ts) is drawn over it and turns as you scroll past;
 * the HTML phone then stays in place, unseen, as the layout slot and the accessible description.
 */
function AppReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  const [three, setThree] = useState(false)

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

  // Loaded after first paint. Without WebGL, or if three.js fails or the GPU drops it, the HTML phone shows.
  useEffect(() => {
    const wrap = ref.current
    const phone = phoneRef.current
    if (!wrap || !phone || !hasWebGL()) return
    let cancelled = false
    let stop: (() => void) | undefined
    import('./three/phone')
      .then(({ startPhone }) => {
        if (cancelled) return
        stop = startPhone(wrap, phone, () => {
          stop = undefined
          setThree(false)
        })
        setThree(true)
      })
      .catch(() => setThree(false))
    return () => {
      cancelled = true
      stop?.()
    }
  }, [])

  return (
    <div ref={ref} className={`lp-phone-wrap ${shown ? 'lp-shown' : ''} ${three ? 'lp-phone-3d' : ''}`}>
      <div ref={phoneRef} className="lp-phone" role="img" aria-label="Preview of the RideRecord home screen: a greeting, a Log a ride button, a Talk instead button, and recent complaints with status chips.">
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
          /* The app's tokens (index.css), so one scheme change restyles both. */
          --blue: var(--color-brand);
          --blue-dark: var(--color-brand-hover);
          --yellow: var(--color-brand-highlight);
          --ink: var(--color-app-ink);
          --muted: var(--color-app-muted);
          --paper: var(--color-app-surface);
          --wash: var(--color-app-background);
          --line: var(--color-app-line);
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
          background: var(--blue); color: var(--paper); font-weight: 600; border-radius: 0.625rem; text-decoration: none;
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
          background: var(--blue); color: var(--paper); font-size: 1.125rem; font-weight: 700;
          border-radius: 0.75rem; text-decoration: none;
        }
        .lp-cta:hover { background: var(--blue-dark); }

        /* App reveal */
        .lp-reveal { background: var(--wash); padding: 6rem 0; }
        .lp-reveal-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;
        }
        @media (max-width: 860px) { .lp-reveal-grid { grid-template-columns: 1fr; } }
        .lp-reveal h2 { font-size: clamp(1.875rem, 4vw, 2.75rem); letter-spacing: -0.02em; line-height: 1.1; margin: 0 0 1rem; }
        .lp-reveal p { color: var(--muted); font-size: 1.125rem; margin: 0; }
        .lp-phone-wrap { position: relative; display: flex; justify-content: center; }
        /* The 3D phone's canvas: the wrap's width, with room above and below for the turn and its shadow. */
        .lp-phone-canvas { position: absolute; left: 0; top: -12%; width: 100%; height: 124%; pointer-events: none; }
        .lp-phone-3d .lp-phone { opacity: 0; }
        .lp-phone {
          width: min(100%, 20rem); background: var(--paper); border: 3px solid var(--ink);
          border-radius: 2rem; padding: 2rem 1.5rem; box-shadow: 0 24px 48px -20px color-mix(in oklab, var(--ink) 25%, transparent);
        }
        .lp-phone-hi { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; margin: 0; color: var(--ink); }
        .lp-phone-sub { color: var(--muted); margin: 0.25rem 0 1.25rem; font-size: 0.9375rem; }
        .lp-phone-btn, .lp-phone-btn2 {
          display: flex; align-items: center; justify-content: center; min-height: 52px;
          border-radius: 0.75rem; font-weight: 700; margin-bottom: 0.75rem;
        }
        .lp-phone-btn { background: var(--blue); color: var(--paper); }
        .lp-phone-btn2 { border: 2px solid var(--blue); color: var(--blue); }
        .lp-phone-row {
          display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
          border-top: 1px solid var(--line); padding: 0.75rem 0.25rem 0; margin-top: 0.75rem;
          font-size: 0.875rem; color: var(--ink);
        }
        .lp-chip { font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; white-space: nowrap; }
        .lp-chip-pending { background: color-mix(in oklab, var(--yellow) 30%, var(--paper)); color: var(--color-pending); }
        .lp-chip-filed { background: var(--color-app-tint); color: var(--blue); }
        .lp-chip-ok { background: color-mix(in oklab, var(--color-filed) 12%, var(--paper)); color: var(--color-filed); }

        /* Sections */
        .lp-section { padding: 6rem 0; }
        .lp-section h2 { font-size: clamp(1.875rem, 4vw, 2.75rem); letter-spacing: -0.02em; line-height: 1.1; margin: 0 0 0.75rem; }
        .lp-section-lead { color: var(--muted); font-size: 1.125rem; margin: 0 0 3rem; max-width: 40rem; }

        .lp-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; list-style: none; padding: 0; margin: 0; }
        @media (max-width: 860px) { .lp-steps { grid-template-columns: 1fr; } }
        .lp-step { border: 1px solid var(--line); border-radius: 1rem; padding: 2rem; }
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
        .lp-stats-note { margin-top: 1.5rem; font-size: 0.875rem; color: var(--muted); max-width: 48rem; }
        .lp-stats-note a { color: var(--blue); text-decoration: underline; text-underline-offset: 2px; }

        /* FAQ */
        .lp-faq { max-width: 48rem; }
        .lp-faq details { border-bottom: 1px solid var(--line); }
        .lp-faq summary {
          cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between;
          gap: 1rem; min-height: 56px; padding: 1rem 0; font-weight: 600; font-size: 1.125rem;
        }
        .lp-faq summary::-webkit-details-marker { display: none; }
        .lp-faq summary::after { content: "+"; font-size: 1.5rem; color: var(--blue); flex: none; }
        .lp-faq details[open] summary::after { content: "−"; }
        .lp-faq details p { color: var(--muted); margin: 0 0 1.25rem; max-width: 40rem; }

        /* CTA band + footer */
        .lp-band { background: var(--blue); color: var(--paper); padding: 5rem 0; text-align: center; }
        .lp-band h2 { font-size: clamp(1.875rem, 4vw, 2.75rem); letter-spacing: -0.02em; margin: 0 0 1rem; }
        .lp-band p { color: color-mix(in oklab, var(--paper) 85%, var(--blue)); font-size: 1.125rem; margin: 0 0 2rem; }
        .lp-band-cta {
          display: inline-flex; align-items: center; justify-content: center; min-height: 56px;
          padding: 0 2.25rem; background: var(--yellow); color: var(--ink);
          font-size: 1.125rem; font-weight: 700; border-radius: 0.75rem; text-decoration: none;
        }
        .lp-band-cta:hover { filter: brightness(1.05); }
        .lp a.lp-band-cta:focus-visible { outline-color: var(--yellow); }
        .lp-footer { border-top: 1px solid var(--line); padding: 2rem 0; }
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
          /* The 3D phone's own turn is its entrance, so it skips the fade and rise. */
          .lp-phone-wrap.lp-phone-3d { opacity: 1; transform: none; transition: none; }
          .lp-cta, .lp-header-cta, .lp-band-cta { transition: background 150ms ease, filter 150ms ease; }
        }
      `}</style>

      <header className="lp-header">
        <a href="#top" className="lp-logo">
          {/* The same clipboard mark as the app's header (App.tsx). */}
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-app-surface">
            <ClipboardCheck className="size-5" aria-hidden="true" />
          </span>
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
            Log it in seconds. We&rsquo;ll draft the complaint and tell you exactly where to send it.
          </p>
          <a href="#app" className="lp-cta">
            Log a ride
          </a>
        </section>

        <Story />

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
                <span className="lp-stat-num">{s.num}</span>
                <p>{s.caption}</p>
              </li>
            ))}
          </ul>
          <p className="lp-stats-note">
            Sources: DDOT figures reported by{' '}
            <a href="https://www.bridgedetroit.com/confidence-ride-requests-up-for-detroit-paratransit/">BridgeDetroit, August 2025</a>;{' '}
            <a href="https://audgen.michigan.gov/wp-content/uploads/2022/03/r391071520-2859.pdf">Michigan Auditor General, Medicaid transportation audit, March 2022</a>{' '}
            (state compliance reviews of Macomb, Oakland and Wayne counties, 2018–2019; a follow-up audit is due in late 2026);{' '}
            <a href="https://detroitmi.gov/taxonomy/term/6646">DDOT ADA complaint procedure</a>.
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
