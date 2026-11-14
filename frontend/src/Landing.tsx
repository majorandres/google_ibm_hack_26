import { useEffect, useRef, useState } from 'react'
import { clockAngles, street, trackProgress } from './three/story'

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

const CAPTIONS = [
  'The doctor’s appointment is at 9:00.',
  'The ride was supposed to be here by now.',
  'The van drives right past.',
  'Another missed appointment. No one owns it.',
]

/** WebGL 2 is what three.js needs; checked before downloading it. */
function hasWebGL() {
  const gl = document.createElement('canvas').getContext('webgl2')
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
  return gl !== null
}

/**
 * The scroll-driven story, from the pitch's hook: a rider in a powered wheelchair
 * waits for a Medicaid ride to a doctor's appointment. The van drives right past,
 * the appointment is missed — and no one owns it.
 * With WebGL (`three`), the stage is an empty slot that the three.js street fills;
 * otherwise the CSS diorama below tells the same story.
 */
function RideScene({ three }: { three: boolean }) {
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
        setP(trackProgress(rect.top, rect.height, window.innerHeight))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  // The story's numbers come from story.ts, shared with the three.js street so both tell it the same way.
  const s = street(p)
  const vanX = -520 + s.vanIn * 480 + s.vanPast * 620 // SVG px: off-screen left → beside the rider → off-screen right
  const { missed, verdict } = s
  // Negative rotateX tips the set toward the viewer: a camera looking down onto the street.
  const camera = `perspective(160cqw) rotateX(${-s.tilt}deg) rotateY(${s.orbit}deg)`
  const stand = `rotateX(${(1 - s.rise) * 84}deg)` // lying flat on the board → upright
  const { minute: minuteAngle, hour: hourAngle } = clockAngles(p) // 9:00 → 9:20

  return (
    <div ref={track} className="lp-scene-track" data-3d="track">
      <div className="lp-scene-sticky">
        <div className="lp-scene-view">
        <div
          className="lp-scene-stage"
          data-3d="street"
          role="img"
          aria-label="Illustration: a wheelchair rider waits outside their home for a ride to a doctor's appointment. The van drives past without stopping, and the appointment is missed."
          style={three ? undefined : { transform: camera }}
        >
          {!three && (<>
          <div className="lp-scene-floor" />
          <div className="lp-scene-edge" />
          {/* clock: the appointment time slipping by, hung at the back of the set */}
          <svg viewBox="0 0 800 300" aria-hidden="true" className="lp-scene-layer" style={{ transform: `translateZ(-12cqw) ${stand}` }}>
            <g transform="translate(400,74)">
              <circle r="30" fill="#fff" stroke="#101828" strokeWidth="3" />
              <line x1="0" y1="0" x2="0" y2="-18" stroke="#101828" strokeWidth="3" strokeLinecap="round" transform={`rotate(${hourAngle})`} />
              <line x1="0" y1="0" x2="0" y2="-24" stroke="#1E40AF" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${minuteAngle})`} />
              <circle r="3" fill="#101828" />
            </g>
          </svg>
          <svg viewBox="0 0 800 300" aria-hidden="true" className="lp-scene-layer" style={{ transform: `translateZ(-7cqw) ${stand}` }}>
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
          </svg>
          {/* wheelchair rider, waiting on the sidewalk outside home */}
          <svg viewBox="0 0 800 300" aria-hidden="true" className="lp-scene-layer" style={{ transform: `translateZ(-2cqw) ${stand}` }}>
          <g transform="translate(230,0)">
            <circle cx="0" cy="158" r="12" fill="#101828" />
            <path d="M0 172 v36 h26" fill="none" stroke="#101828" strokeWidth="6" strokeLinecap="round" />
            <circle cx="6" cy="228" r="20" fill="none" stroke="#101828" strokeWidth="5" />
            <circle cx="34" cy="240" r="8" fill="none" stroke="#101828" strokeWidth="4" />
          </g>
          </svg>
          {/* paratransit van with accessibility symbol, in the road lane in front of the rider */}
          <svg viewBox="0 0 800 300" aria-hidden="true" className="lp-scene-layer" style={{ transform: `translateZ(5cqw) ${stand}` }}>
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
          </svg>
          {/* the missed appointment, marked on a calendar, comes forward to face the viewer */}
          <svg viewBox="0 0 800 300" aria-hidden="true" className="lp-scene-layer" style={{ transform: `translateZ(${-4 + verdict * 16}cqw)`, opacity: verdict }}>
            <g transform="translate(520,60)">
              <rect x="-34" y="-26" width="68" height="60" rx="6" fill="#fff" stroke="#101828" strokeWidth="3" />
              <rect x="-34" y="-26" width="68" height="16" rx="6" fill="#1E40AF" />
              <path d="M-14 2 L14 26 M14 2 L-14 26" stroke="#b42318" strokeWidth="5" strokeLinecap="round" />
            </g>
          </svg>
          </>)}
        </div>
        </div>
        <p className="lp-scene-caption" aria-live="polite">
          {CAPTIONS[s.phase]}
        </p>
      </div>
    </div>
  )
}

/**
 * Phone frame with a miniature of the app home screen; it turns in 3D as you scroll past.
 * With WebGL it is the slot for the three.js phone and is drawn invisibly (it keeps its description).
 */
function AppReveal() {
  return (
    <div className="lp-phone-wrap">
      <div className="lp-phone" data-3d="phone" role="img" aria-label="Preview of the RideRecord home screen: a greeting, a Log a ride button, a Talk instead button, and recent complaints with status chips.">
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
  const root = useRef<HTMLDivElement>(null)
  const [three, setThree] = useState(false)

  // Real 3D models, loaded after first paint. Without WebGL, or if three.js fails, the drawings stay.
  useEffect(() => {
    const el = root.current
    if (!el || !hasWebGL()) return
    let cancelled = false
    let stop: (() => void) | undefined
    import('./three/world')
      .then(({ startWorld }) => {
        if (cancelled) return
        stop = startWorld(el, () => {
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
    <div ref={root} className={three ? 'lp lp-3d' : 'lp'}>
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
          overflow-x: clip; /* 3D pieces may swing past the edge; clip keeps sticky working */
        }
        .lp h1, .lp h2, .lp h3, .lp-display { font-family: 'Space Grotesk', 'Inter', ui-sans-serif, sans-serif; }
        .lp a:focus-visible, .lp summary:focus-visible {
          outline: 3px solid var(--blue);
          outline-offset: 3px;
          border-radius: 4px;
        }
        .lp-wrap { max-width: 72rem; margin: 0 auto; padding: 0 1.5rem; }

        /* Solid type: every letter has depth, extruded toward the bottom right like the 3D scene's shadows.
           With WebGL, the headings and numbers become real 3D letters instead (three/type3d.ts). */
        .lp { text-shadow: 0 1px 0 rgba(30, 64, 175, 0.12); }
        .lp h1, .lp h2, .lp-stat-num { text-shadow: 1px 1px 0 #c3cdee, 2px 2px 0 #a9b7e6, 3px 3px 0 #8fa1dc, 4px 4px 0 #7489d0; }
        .lp h3, .lp-scene-caption { text-shadow: 1px 1px 0 #c3cdee, 2px 2px 0 #a9b7e6; }
        .lp-logo, .lp-faq summary, .lp-step-num { text-shadow: 1px 1px 0 #b6c3ea; } /* small text: one layer stays crisp */
        .lp-cta, .lp-header-cta { text-shadow: 1px 1px 0 #142c78, 2px 2px 0 #0f2260; }
        /* Containers give the components inside them a perspective to tilt in (tilt.ts). */
        .lp-header, .lp-hero, .lp-steps, .lp-stats, .lp-faq, .lp-band .lp-wrap { perspective: 900px; }

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
        /* CTAs are physical keys: a visible edge that shrinks when pressed */
        .lp-header-cta, .lp-cta { box-shadow: 0 4px 0 #142c78; }
        .lp-header-cta:active, .lp-cta:active { box-shadow: 0 1px 0 #142c78; }

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
        .lp-hero-clock { width: 7rem; height: 7rem; margin: 0 auto 1.75rem; }
        .lp-hero-clock svg { display: block; width: 100%; height: 100%; }

        /* Scroll scene */
        .lp-scene-track { height: 280vh; }
        .lp-scene-sticky {
          position: sticky; top: 0; min-height: 100dvh;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 2rem 1rem;
        }
        /* The diorama: SVG cut-outs standing on a board, each at its own depth.
           Depths are in cqw so the set keeps its proportions from phone to desktop. */
        .lp-scene-view { container-type: inline-size; width: min(100%, 62rem); }
        .lp-scene-stage { position: relative; aspect-ratio: 8 / 3; margin-bottom: 7cqw; transform-style: preserve-3d; }
        .lp-scene-layer { position: absolute; inset: 0; width: 100%; height: 100%; transform-origin: 50% 83.333%; } /* hinge on the ground line, y=250 of 300 */
        .lp-scene-floor {
          position: absolute; left: 0; top: 83.333%; width: 100%; height: 19cqw;
          transform-origin: top; transform: translateZ(-7cqw) rotateX(90deg); /* from the building fronts to the front lip */
          border-top: 3px solid var(--ink);
          background:
            repeating-linear-gradient(90deg, var(--yellow) 0 5%, transparent 5% 9%) 0 84% / 100% 3% no-repeat,
            linear-gradient(#f2f4f7 0 25%, var(--ink) 25% 27%, #d0d5dd 27%);
        }
        .lp-scene-edge { position: absolute; left: 0; top: 83.333%; width: 100%; height: 2.4cqw; background: var(--blue); transform: translateZ(12cqw); }
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
        .lp-phone-wrap { display: flex; justify-content: center; perspective: 70rem; }
        .lp-phone {
          position: relative; transform-style: preserve-3d; transform: rotateY(-14deg) rotateX(6deg);
          width: min(100%, 20rem); background: #fff; border: 3px solid var(--ink);
          border-radius: 2rem; padding: 2rem 1.5rem; box-shadow: 0 24px 48px -20px rgba(16,24,40,0.25);
        }
        /* the phone's body behind the screen, and the screen's pieces lifted off the glass */
        .lp-phone::before { content: ""; position: absolute; inset: -3px; border-radius: inherit; background: var(--ink); transform: translateZ(-1rem); }
        .lp-phone-hi, .lp-phone-sub { transform: translateZ(1.25rem); }
        .lp-phone-btn, .lp-phone-btn2 { transform: translateZ(1.75rem); }
        .lp-phone-row { transform: translateZ(0.75rem); }
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
        .lp-step {
          border: 1px solid #e4e7ec; border-radius: 1rem; padding: 2rem; background: #fff;
          box-shadow: 0 5px 0 -1px #dfe5f2, 0 18px 30px -20px rgba(16, 24, 40, 0.35); /* a slab: edge + soft shadow */
        }
        .lp-step-icon-slot { width: 4rem; height: 4rem; }
        .lp-step-icon { display: block; width: 100%; height: 100%; color: var(--blue); }
        .lp-step h3 { font-size: 1.25rem; margin: 1.25rem 0 0.5rem; }
        .lp-step p { color: var(--muted); margin: 0; }
        .lp-step-num { font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: var(--blue); font-size: 0.875rem; letter-spacing: 0.12em; }

        .lp-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; list-style: none; padding: 0; margin: 0; }
        @media (max-width: 860px) { .lp-stats { grid-template-columns: 1fr; } }
        .lp-stat { background: var(--wash); border-radius: 1rem; padding: 2rem; box-shadow: 0 5px 0 -1px #d3dbef, 0 18px 30px -20px rgba(16, 24, 40, 0.3); }
        .lp-stat-num {
          font-family: 'Space Grotesk', sans-serif; font-size: 3.5rem; font-weight: 700;
          color: var(--blue); line-height: 1; letter-spacing: -0.02em;
        }
        .lp-stat p { color: var(--muted); margin: 1rem 0 0; }
        .lp-stats-note { margin-top: 1.5rem; font-size: 0.875rem; color: var(--muted); max-width: 48rem; }
        .lp-stats-note a { color: var(--blue); text-decoration: underline; text-underline-offset: 2px; }

        /* FAQ */
        .lp-faq { max-width: 48rem; display: grid; gap: 0.75rem; }
        .lp-faq details {
          border: 1px solid #e4e7ec; border-radius: 0.875rem; background: #fff; padding: 0 1.25rem;
          box-shadow: 0 4px 0 -1px #dfe5f2, 0 14px 24px -18px rgba(16, 24, 40, 0.35); /* each question is a raised tile */
        }
        .lp-faq summary {
          cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between;
          gap: 1rem; min-height: 56px; padding: 1rem 0; font-weight: 600; font-size: 1.125rem;
        }
        .lp-faq summary::-webkit-details-marker { display: none; }
        .lp-faq summary::after { content: "+"; font-size: 1.5rem; color: var(--blue); flex: none; }
        .lp-faq details[open] summary::after { content: "−"; }
        .lp-faq details p { color: var(--muted); margin: 0 0 1.25rem; max-width: 40rem; }

        /* CTA band + footer */
        .lp-band {
          background: var(--blue); color: #fff; padding: 5rem 0; text-align: center;
          box-shadow: inset 0 6px 0 rgba(255, 255, 255, 0.1), inset 0 -8px 0 rgba(0, 0, 0, 0.18); /* bevelled edges */
        }
        .lp-band h2 { font-size: clamp(1.875rem, 4vw, 2.75rem); letter-spacing: -0.02em; margin: 0 0 1rem; }
        .lp-band p { color: #dbe4ff; font-size: 1.125rem; margin: 0 0 2rem; }
        .lp-band-cta {
          display: inline-flex; align-items: center; justify-content: center; min-height: 56px;
          padding: 0 2.25rem; background: var(--yellow); color: var(--ink);
          font-size: 1.125rem; font-weight: 700; border-radius: 0.75rem; text-decoration: none;
        }
        .lp-band-cta:hover { filter: brightness(1.05); }
        .lp-band-cta { box-shadow: 0 4px 0 #a16207; text-shadow: 1px 1px 0 rgba(161, 98, 7, 0.4); }
        .lp-band h2 { text-shadow: 1px 1px 0 #142c78, 2px 2px 0 #0f2260, 3px 3px 0 #0c1b4d; }
        .lp-band p { text-shadow: 0 1px 0 rgba(0, 0, 0, 0.25); }
        .lp-band-cta:active { box-shadow: 0 1px 0 #a16207; }
        .lp-band-cta:focus-visible { outline-color: var(--yellow); }
        .lp-footer { border-top: 1px solid #e4e7ec; padding: 2rem 0; }
        .lp-footer-inner {
          display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem;
          font-size: 0.875rem; color: var(--muted);
        }
        .lp-footer nav { display: flex; gap: 1.5rem; }
        .lp-footer a { color: var(--blue); text-decoration: none; font-weight: 600; }
        .lp-footer a:hover { text-decoration: underline; }

        /* With WebGL on (.lp-3d), three.js draws the street, clock, phone and icons over these slots. */
        .lp-world { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .lp-3d .lp-hero-clock > svg, .lp-3d .lp-step-icon-slot > svg { visibility: hidden; }
        .lp-3d .lp-phone { opacity: 0; animation: none; transform: none; }
        /* Real 3D letters on (three/world.ts sets data-type): the HTML text keeps its place for layout and
           screen readers, unseen, and nothing transforms it so the letters can be measured from it. */
        .lp[data-type='on'] [data-3d-text] { opacity: 0; text-shadow: none; }
        .lp[data-type='on'] :is(.lp-hero, .lp-reveal-copy, .lp-section > h2, .lp-band .lp-wrap) { animation: none; transform: none; }

        /* Motion: everything animated only when motion is welcome */
        @media (prefers-reduced-motion: no-preference) {
          .lp-cta, .lp-header-cta, .lp-band-cta { transition: background 150ms ease, filter 150ms ease, translate 90ms ease, box-shadow 90ms ease, rotate 140ms ease-out; }
          .lp-cta:active, .lp-header-cta:active, .lp-band-cta:active { translate: 0 3px; }
          /* cards tilt toward the mouse (tilt.ts); clickable text sinks when pressed */
          .lp-step, .lp-stat, .lp-faq details, .lp-logo { transition: rotate 160ms ease-out; }
          .lp-faq summary, .lp-footer a { transition: translate 90ms ease; }
          .lp-faq summary:active, .lp-footer a:active { translate: 0 2px; }
          /* an answer unfolds down from its question */
          .lp-faq details[open] > p { transform-origin: 50% 0; animation: lp-unfold 320ms cubic-bezier(0.16, 1, 0.3, 1) both; }
          @keyframes lp-unfold { from { transform: perspective(40rem) rotateX(-80deg); opacity: 0; } }
        }
        /* Scroll-linked 3D. Browsers without scroll timelines keep the still, readable layout. */
        @media (prefers-reduced-motion: no-preference) {
          @supports (animation-timeline: view()) {
            /* the headline folds back onto the page as the street rises behind it */
            .lp-hero { transform-origin: 50% 100%; animation: lp-fold-back ease-in both; animation-timeline: view(); animation-range: exit; }
            @keyframes lp-fold-back { to { transform: perspective(60rem) rotateX(55deg); opacity: 0; } }

            /* the phone turns in your hand as it passes */
            .lp-phone { animation: lp-turn linear both; animation-timeline: view(); animation-range: cover; }
            @keyframes lp-turn {
              from { transform: translateY(3rem) rotateY(-38deg) rotateX(18deg); }
              50% { transform: rotateY(-12deg) rotateX(5deg); }
              to { transform: rotateY(16deg) rotateX(-6deg); }
            }

            /* the three steps stand up like pop-up pages, in order */
            .lp-step { transform-origin: 50% 100%; animation: lp-stand cubic-bezier(0.16, 1, 0.3, 1) both; animation-timeline: view(); animation-range: entry 0% cover 40%; }
            .lp-step:nth-child(2) { animation-range: entry 10% cover 46%; }
            .lp-step:nth-child(3) { animation-range: entry 20% cover 52%; }
            @keyframes lp-stand { from { transform: perspective(60rem) rotateX(80deg); } }

            /* the header folds away with the headline; the logo's bus turns as it goes */
            .lp-header { transform-origin: 50% 100%; animation: lp-fold-back ease-in both; animation-timeline: view(); animation-range: exit; }
            .lp-logo svg { animation: lp-half-turn linear both; animation-timeline: view(); animation-range: exit; }
            @keyframes lp-half-turn { to { transform: perspective(20rem) rotateY(180deg); } }

            /* the copy swings in opposite the phone */
            .lp-reveal-copy { transform-origin: 0 50%; animation: lp-swing linear both; animation-timeline: view(); animation-range: cover; }
            @keyframes lp-swing {
              from { transform: perspective(60rem) rotateY(26deg); }
              50% { transform: perspective(60rem) rotateY(0deg); }
              to { transform: perspective(60rem) rotateY(-10deg); }
            }

            /* headings come forward out of depth */
            .lp-section > h2, .lp-section-lead { animation: lp-forward cubic-bezier(0.16, 1, 0.3, 1) both; animation-timeline: view(); animation-range: entry 0% cover 30%; }
            @keyframes lp-forward { from { transform: perspective(40rem) translateZ(-12rem); } }

            /* stat tiles drop into place like departure-board flaps */
            .lp-stat { transform-origin: 50% 0; animation: lp-flap cubic-bezier(0.16, 1, 0.3, 1) both; animation-timeline: view(); animation-range: entry 0% cover 40%; }
            .lp-stat:nth-child(2) { animation-range: entry 10% cover 46%; }
            .lp-stat:nth-child(3) { animation-range: entry 20% cover 52%; }
            @keyframes lp-flap { from { transform: perspective(50rem) rotateX(-90deg); } }

            /* the closing band tilts up toward you, its button standing out in front */
            .lp-band .lp-wrap { transform-style: preserve-3d; transform-origin: 50% 100%; animation: lp-tilt-up cubic-bezier(0.16, 1, 0.3, 1) both; animation-timeline: view(); animation-range: entry 0% cover 45%; }
            @keyframes lp-tilt-up {
              from { transform: perspective(60rem) rotateX(40deg); }
              to { transform: perspective(60rem) rotateX(0deg); }
            }
            .lp-band-cta { transform: translateZ(3rem); }

            /* With real 3D letters the headings move in WebGL; the text beside them keeps its CSS motion. */
            .lp[data-type='on'] :is(.lp-hero-sub, .lp-cta) { transform-origin: 50% 100%; animation: lp-fold-back ease-in both; animation-timeline: view(); animation-range: exit; }
            .lp[data-type='on'] .lp-reveal-copy > p { transform-origin: 0 50%; animation: lp-swing linear both; animation-timeline: view(); animation-range: cover; }
            .lp[data-type='on'] .lp-band .lp-wrap > :not(h2) { transform-origin: 50% 100%; animation: lp-tilt-up cubic-bezier(0.16, 1, 0.3, 1) both; animation-timeline: view(); animation-range: entry 0% cover 45%; }

            /* the footer hinges up at the end of the page */
            .lp-footer-inner { transform-origin: 50% 100%; animation: lp-hinge-up cubic-bezier(0.16, 1, 0.3, 1) both; animation-timeline: view(); animation-range: entry 0% entry 100%; }
            @keyframes lp-hinge-up { from { transform: perspective(40rem) rotateX(70deg); } }
          }
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
          {/* 9:00 on a station clock. With WebGL a 3D clock fills this slot and flies down into the street. */}
          <div className="lp-hero-clock" data-3d="clock" aria-hidden="true">
            <svg viewBox="-36 -36 72 72">
              <circle r="31" fill="#fff" stroke="#101828" strokeWidth="5" />
              <line y2="-17" stroke="#101828" strokeWidth="4" strokeLinecap="round" transform="rotate(270)" />
              <line y2="-24" stroke="#1E40AF" strokeWidth="3" strokeLinecap="round" />
              <circle r="3.5" fill="#101828" />
            </svg>
          </div>
          <h1 id="lp-hero-h" data-3d-text="hero">
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

        <RideScene three={three} />

        {/* 2. App reveal */}
        <section className="lp-reveal" aria-labelledby="lp-reveal-h">
          <div className="lp-wrap lp-reveal-grid">
            <div className="lp-reveal-copy">
              <h2 id="lp-reveal-h" data-3d-text="heading">Your own record of every ride</h2>
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
          <h2 id="lp-how-h" data-3d-text="heading">How it works</h2>
          <p className="lp-section-lead">Three steps between a failed ride and a filed complaint.</p>
          <ol className="lp-steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="lp-step">
                <span className="lp-step-num">STEP {i + 1}</span>
                <div className="lp-step-icon-slot" data-3d={`step-${i}`}>{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 4. Why it matters */}
        <section className="lp-section lp-wrap" aria-labelledby="lp-why-h">
          <h2 id="lp-why-h" data-3d-text="heading">Why it matters</h2>
          <p className="lp-section-lead">
            Paratransit isn&rsquo;t a convenience. For thousands of Michigan riders, it&rsquo;s the only way
            there.
          </p>
          <ul className="lp-stats">
            {STATS.map((s) => (
              <li key={s.caption} className="lp-stat">
                <span className="lp-stat-num" data-3d-text="number">{s.num}</span>
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
          <h2 id="lp-faq-h" data-3d-text="heading">Questions, answered</h2>
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
            <h2 id="lp-band-h" data-3d-text="heading">Next time the ride doesn&rsquo;t show, be ready.</h2>
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
