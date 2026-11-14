import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * The landing's scroll story, in five pinned chapters. Each chapter sticks to the screen
 * while its section scrolls past, and the scroll position (0 to 1) drives what happens in it.
 * Scrolling is never hijacked: the wheel, keys and scrollbar work as normal.
 *
 * Every colour is a design token from index.css, so changing the app's scheme changes this too.
 * Visible chapter text is decorative (aria-hidden); each chapter carries the full sentence as
 * screen-reader text, so a half-typed line is never read out. With reduced motion the chapters
 * stop pinning and each shows its finished state.
 */

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
/** Progress through the window [a, b] of the chapter's own 0..1 progress. */
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
const easeOut = (t: number) => 1 - (1 - t) ** 3

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/** 0 when the section's top reaches the top of the screen, 1 when its bottom does. */
function useProgress(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  const [p, setP] = useState(0)
  useEffect(() => {
    if (!active) return
    let raf = 0
    const read = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      if (r.bottom < -100 || r.top > innerHeight + 100) return // off screen: no re-render
      const span = r.height - innerHeight
      const next = span > 0 ? clamp01(-r.top / span) : 1
      setP((prev) => (Math.abs(prev - next) < 0.001 ? prev : next))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    read()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => {
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [ref, active])
  return p
}

function Chapter(props: {
  id: string
  vh: number // section height in viewport heights; the pinned stretch is vh - 100
  tone?: 'dark' | 'light'
  heading: string
  telling: string // the whole chapter as plain sentences, for screen readers
  reduced: boolean
  still: number // the progress to show when motion is reduced
  children: (p: number) => ReactNode
}) {
  const ref = useRef<HTMLElement>(null)
  const live = useProgress(ref, !props.reduced)
  const p = props.reduced ? props.still : live
  return (
    <section
      ref={ref}
      id={props.id}
      aria-labelledby={`${props.id}-h`}
      className={`st-ch st-${props.tone ?? 'dark'}`}
      style={props.reduced ? undefined : { height: `${props.vh}vh` }}
      data-progress={p.toFixed(2)}
    >
      <div className="st-pin">
        <h2 id={`${props.id}-h`} className="sr-only">
          {props.heading}
        </h2>
        <p className="sr-only">{props.telling}</p>
        <div className="st-stage" aria-hidden="true">
          {props.children(p)}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- 1. The wait */

const WAIT_WORDS = 'The ride is booked for eight. The appointment is at nine.'.split(' ')

function Wait({ p }: { p: number }) {
  // The clock runs 8:00 to 9:40 across the chapter: an hour and forty minutes at the curb.
  const minutes = 8 * 60 + Math.round(easeOut(seg(p, 0.08, 0.92)) * 100)
  const clock = `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`
  const late = minutes > 9 * 60
  const ticks = 40
  const lit = Math.round(seg(p, 0.08, 0.92) * ticks)
  return (
    <div className="st-wait">
      <p className="st-kicker">At the curb</p>
      <p className={`st-clock ${late ? 'st-clock-late' : ''}`}>{clock}</p>
      <p className="st-words">
        {WAIT_WORDS.map((w, i) => (
          <span key={i} className={p > 0.04 + i * 0.045 ? 'st-word-on' : ''}>
            {w}{' '}
          </span>
        ))}
      </p>
      <div className="st-ticks">
        {Array.from({ length: ticks }, (_, i) => (
          <span key={i} className={i < lit ? (i >= 24 ? 'st-tick-late' : 'st-tick-on') : ''} />
        ))}
      </div>
      <p className="st-caption" style={{ opacity: seg(p, 0.6, 0.75) }}>
        Nine o&rsquo;clock comes and goes.
      </p>
    </div>
  )
}

/* ---------------------------------------------------------------- 2. The van */

// A paratransit van drawn in dots. X = body, Y = the stripe, . = empty (windows, gaps).
const VAN = [
  '..XXXXXXXXXXXXXXXXXXX.....',
  '.XXXXXXXXXXXXXXXXXXXXXX...',
  '.XX...XX...XX...XXX.XXXX..',
  '.XX...XX...XX...XXX..XXXX.',
  '.XXXXXXXXXXXXXXXXXX...XXXX',
  '.XXXXXXXXXXXXXXXXXXXXXXXXX',
  '.YYYYYYYYYYYYYYYYYYYYYYYYY',
  '.XXXXXXXXXXXXXXXXXXXXXXXXX',
  '.XXX..XXXXXXXXXXXXX..XXXXX',
  '...XXX.............XXX....',
  '..XXXXX...........XXXXX...',
  '...XXX.............XXX....',
]
const COLS = VAN[0]!.length
// Deterministic scatter so the van assembles the same way every visit.
const rand = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453
  return x - Math.floor(x)
}
const DOTS = VAN.flatMap((row, r) =>
  [...row].flatMap((ch, c) => (ch === '.' ? [] : [{ r, c, stripe: ch === 'Y', k: r * COLS + c }])),
)

function Van({ p, reduced }: { p: number; reduced: boolean }) {
  const cell = 'var(--st-cell)'
  const leaving = seg(p, 0.62, 0.95)
  const caption = reduced || p > 0.62 ? 'It never arrives.' : p > 0.3 ? 'The van is on its way.' : ''
  return (
    <div className="st-van-wrap">
      <div className="st-van" style={{ width: `calc(${COLS} * ${cell})`, height: `calc(${VAN.length} * ${cell})` }}>
        {DOTS.map((d) => {
          // In: dots fly from a scatter into place, left columns first.
          const t = reduced ? 1 : easeOut(seg(p, 0.02 + (d.c / COLS) * 0.18, 0.32 + (d.c / COLS) * 0.12))
          // Out: from the front of the van backwards, dots drift off and fade.
          const o = reduced ? 0 : seg(leaving, ((COLS - d.c) / COLS) * 0.55, ((COLS - d.c) / COLS) * 0.55 + 0.45)
          const sx = (rand(d.k) - 0.5) * 900 * (1 - t) + o * (120 + rand(d.k + 7) * 260)
          const sy = (rand(d.k + 3) - 0.5) * 600 * (1 - t) - o * rand(d.k + 11) * 80
          return (
            <span
              key={d.k}
              className={d.stripe ? 'st-dot st-dot-stripe' : 'st-dot'}
              style={{
                left: `calc(${d.c} * ${cell})`,
                top: `calc(${d.r} * ${cell})`,
                transform: `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`,
                opacity: (0.15 + 0.85 * t) * (reduced ? 0.35 : 1 - o),
              }}
            />
          )
        })}
      </div>
      <p className="st-big" key={caption}>
        {caption}
      </p>
    </div>
  )
}

/* ---------------------------------------------------------------- 3. No one owns it */

const RUNAROUND = [
  'The rider calls to ask why.',
  'The ride company points to its contractors.',
  'The insurer cites privacy rules.',
  'No one owns it.',
]

function Runaround({ p, reduced }: { p: number; reduced: boolean }) {
  if (reduced) {
    return (
      <div className="st-run">
        {RUNAROUND.map((line, i) => (
          <p key={i} className={i === RUNAROUND.length - 1 ? 'st-big' : 'st-line'}>
            {line}
          </p>
        ))}
        <SourceNote />
      </div>
    )
  }
  // Each line gets an equal slice: type it out, hold it, then backspace it (the last line stays).
  const n = RUNAROUND.length
  const i = Math.min(n - 1, Math.floor(p * n))
  const local = p * n - i
  const line = RUNAROUND[i]!
  const typed = local < 0.55 ? local / 0.55 : i === n - 1 || local < 0.85 ? 1 : 1 - (local - 0.85) / 0.15
  const shown = line.slice(0, Math.round(typed * line.length))
  return (
    <div className="st-run">
      <p className="st-step">
        {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
      </p>
      <p className={i === n - 1 ? 'st-big' : 'st-line'}>
        {shown}
        <span className="st-caret" />
      </p>
      <SourceNote />
    </div>
  )
}

function SourceNote() {
  return (
    <p className="st-source">
      From a March 2026 WDIV ClickOnDetroit report about a Michigan rider who missed nearly a dozen doctor&rsquo;s
      appointments.
    </p>
  )
}

/* ---------------------------------------------------------------- 4. Logged */

function Logged({ p }: { p: number }) {
  // Paper floods in from the centre, then the word stamps down with its echoes.
  const flood = easeOut(seg(p, 0.0, 0.35))
  const stamp = easeOut(seg(p, 0.3, 0.55))
  const settle = seg(p, 0.55, 0.85)
  const row = seg(p, 0.6, 0.8)
  return (
    <div className="st-logged">
      <div className="st-paper" style={{ clipPath: `circle(${(flood * 75).toFixed(1)}% at 50% 50%)` }} />
      <div className="st-stamp" style={{ opacity: stamp, transform: `scale(${(1.5 - 0.5 * stamp).toFixed(3)})` }}>
        {[3, 2, 1].map((k) => (
          <span key={k} className="st-echo" style={{ transform: `translate(${(k * 7 * (1 - settle * 0.6)).toFixed(1)}px, ${(k * 7 * (1 - settle * 0.6)).toFixed(1)}px)`, opacity: 0.5 - k * 0.12 }}>
            LOGGED
          </span>
        ))}
        <span className="st-stamp-word">LOGGED</span>
      </div>
      <div className="st-record" style={{ opacity: row, transform: `translateY(${((1 - row) * 24).toFixed(1)}px)` }}>
        <span>
          <time>Today</time> · Coming back · Never came
        </span>
        <span className="chip chip-pending">To file</span>
      </div>
      <p className="st-caption st-caption-ink" style={{ opacity: seg(p, 0.72, 0.9) }}>
        Ten seconds at the curb, by tap or by voice. Now it&rsquo;s on the record.
      </p>
    </div>
  )
}

/* ---------------------------------------------------------------- 5. The pattern */

const RIDES = ['Late · 45 min', 'Never came', 'Late · 70 min']

function Pattern({ p }: { p: number }) {
  const wipe = easeOut(seg(p, 0.35, 0.7)) * 100 // how far the panel has crossed, in %
  return (
    <div className="st-pattern">
      <ul className="st-rides">
        {RIDES.map((r, i) => {
          const t = easeOut(seg(p, 0.02 + i * 0.09, 0.2 + i * 0.09))
          return (
            <li key={r} style={{ opacity: t, transform: `translateX(${((1 - t) * -40).toFixed(1)}px)` }}>
              {r}
            </li>
          )
        })}
      </ul>
      <div className="st-wipe">
        <p className="st-wipe-base" style={{ clipPath: `inset(0 0 0 ${wipe.toFixed(1)}%)` }}>
          Just a bad day?
        </p>
        <p className="st-wipe-panel" style={{ clipPath: `inset(0 ${(100 - wipe).toFixed(1)}% 0 0)` }}>
          A pattern.
        </p>
      </div>
      <p className="st-caption" style={{ opacity: seg(p, 0.7, 0.88) }}>
        Federal rule 49 CFR 37.131(f) bars patterns of late pickups and missed trips. RideRecord drafts the complaint,
        finds the right office and counts the days left to file. You review it and you send it.
      </p>
    </div>
  )
}

/* ---------------------------------------------------------------- The story */

const CHAPTERS = ['The wait', 'The van', 'No one owns it', 'Logged', 'The pattern'] as const

export default function Story() {
  const reduced = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [current, setCurrent] = useState(0)

  // The skip link and chapter bar only show while the story is on screen.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(!!e?.isIntersecting), { threshold: 0 })
    io.observe(el)
    const onScroll = () => {
      const chapters = el.querySelectorAll<HTMLElement>('.st-ch')
      let idx = 0
      chapters.forEach((c, i) => {
        if (c.getBoundingClientRect().top <= innerHeight * 0.5) idx = i
      })
      setCurrent(idx)
    }
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => {
      io.disconnect()
      removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div ref={root} className={`st ${reduced ? 'st-still' : ''}`}>
      <style>{STORY_CSS}</style>

      <Chapter
        id="st-wait" vh={210} reduced={reduced} still={1}
        heading="The wait"
        telling="The ride is booked for eight. The appointment is at nine. The rider waits at the curb from 8:00 to 9:40. Nine o'clock comes and goes."
      >
        {(p) => <Wait p={p} />}
      </Chapter>

      <Chapter
        id="st-van" vh={230} reduced={reduced} still={0.5}
        heading="The van"
        telling="The van is on its way. It never arrives."
      >
        {(p) => <Van p={p} reduced={reduced} />}
      </Chapter>

      <Chapter
        id="st-runaround" vh={260} reduced={reduced} still={1}
        heading="No one owns it"
        telling={`${RUNAROUND.join(' ')} From a March 2026 WDIV ClickOnDetroit report about a Michigan rider who missed nearly a dozen doctor's appointments.`}
      >
        {(p) => <Runaround p={p} reduced={reduced} />}
      </Chapter>

      <Chapter
        id="st-logged" vh={210} tone="light" reduced={reduced} still={1}
        heading="Logged"
        telling="With RideRecord the rider logs it: today, coming back, never came, to file. Ten seconds at the curb, by tap or by voice. Now it's on the record."
      >
        {(p) => <Logged p={p} />}
      </Chapter>

      <Chapter
        id="st-pattern" vh={230} reduced={reduced} still={1}
        heading="The pattern"
        telling="Late, 45 minutes. Never came. Late, 70 minutes. Just a bad day? A pattern. Federal rule 49 CFR 37.131(f) bars patterns of late pickups and missed trips. RideRecord drafts the complaint, finds the right office and counts the days left to file. You review it and you send it."
      >
        {(p) => <Pattern p={p} />}
      </Chapter>

      <div id="st-end" />

      {/* Always one tap away while the story is on screen: where you are, and a way out. */}
      <nav aria-label="Story" className={`st-bar ${inView && !reduced ? 'st-bar-on' : ''}`}>
        <ol className="st-progress" aria-hidden="true">
          {CHAPTERS.map((c, i) => (
            <li key={c} className={i <= current ? 'st-progress-on' : ''} />
          ))}
        </ol>
        <span className="st-bar-label">
          {current + 1} of {CHAPTERS.length} · {CHAPTERS[current]}
        </span>
        <a href="#st-end" className="st-skip">
          Skip the story
        </a>
      </nav>
    </div>
  )
}

/* ---------------------------------------------------------------- Styles */
// Tokens only: --color-app-ink (night), --color-app-surface (paper), --color-brand (panel),
// --color-brand-highlight (accent), --color-app-muted / --color-app-line (quiet).

const STORY_CSS = `
.st {
  --st-night: var(--color-app-ink);
  --st-paper: var(--color-app-surface);
  --st-accent: var(--color-brand-highlight);
  --st-panel: var(--color-brand);
  --st-soft: color-mix(in oklab, var(--color-app-surface) 72%, transparent);
  --st-faint: color-mix(in oklab, var(--color-app-surface) 16%, transparent);
  --st-cell: clamp(9px, 2.6vw, 22px);
  position: relative;
}
.st-ch { position: relative; }
.st-dark { background: var(--st-night); color: var(--st-paper); }
.st-light { background: var(--st-night); color: var(--color-app-ink); }
.st-pin {
  position: sticky; top: 0; height: 100dvh; overflow: hidden;
  display: flex; align-items: center; justify-content: center; padding: 2rem 1.5rem;
}
.st-stage { width: min(100%, 64rem); position: relative; }
.st-kicker { font-family: var(--font-mono); font-size: 0.8125rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--st-soft); margin: 0; }
.st-caption { margin: 2rem auto 0; max-width: 40rem; font-size: clamp(1.0625rem, 0.9rem + 0.6vw, 1.375rem); line-height: 1.5; color: var(--st-soft); text-align: center; }
.st-caption-ink { color: var(--color-app-muted); position: relative; }
.st-big { font-family: var(--font-display); font-weight: 700; font-size: clamp(2.25rem, 1.2rem + 5vw, 5rem); line-height: 1.02; letter-spacing: -0.03em; margin: 1.5rem 0 0; text-align: center; }

/* 1. the wait */
.st-wait { text-align: center; }
.st-clock {
  font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-weight: 600;
  font-size: clamp(5rem, 2rem + 16vw, 13rem); line-height: 1; margin: 0.5rem 0 1rem; letter-spacing: -0.04em;
  transition: color 300ms ease, -webkit-text-stroke-color 300ms ease;
}
.st-clock-late { color: transparent; -webkit-text-stroke: 2px var(--st-accent); }
.st-words { font-family: var(--font-display); font-weight: 700; font-size: clamp(1.5rem, 0.9rem + 2.4vw, 2.75rem); line-height: 1.2; max-width: 46rem; margin: 0 auto; }
.st-words span { color: transparent; -webkit-text-stroke: 1px var(--st-faint); transition: color 260ms ease, -webkit-text-stroke-color 260ms ease; }
.st-words span.st-word-on { color: var(--st-paper); -webkit-text-stroke-color: transparent; }
.st-ticks { display: flex; justify-content: center; gap: clamp(3px, 0.6vw, 7px); margin-top: 2.5rem; }
.st-ticks span { width: clamp(4px, 0.7vw, 8px); height: clamp(4px, 0.7vw, 8px); border-radius: 50%; background: var(--st-faint); transition: background 200ms ease, transform 200ms ease; }
.st-ticks span.st-tick-on { background: var(--st-paper); }
.st-ticks span.st-tick-late { background: var(--st-accent); transform: scale(1.35); }

/* 2. the van */
.st-van-wrap { display: flex; flex-direction: column; align-items: center; }
.st-van { position: relative; }
.st-dot { position: absolute; width: calc(var(--st-cell) * 0.62); height: calc(var(--st-cell) * 0.62); border-radius: 50%; background: var(--st-paper); will-change: transform, opacity; }
.st-dot-stripe { background: var(--st-accent); }
.st-van-wrap .st-big { animation: st-fade 420ms ease both; }
@keyframes st-fade { from { opacity: 0; transform: translateY(10px); } }

/* 3. no one owns it */
.st-run { text-align: center; min-height: 18rem; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.st-step { font-family: var(--font-mono); font-size: 0.8125rem; letter-spacing: 0.14em; color: var(--st-soft); margin: 0 0 1rem; }
.st-line { font-family: var(--font-display); font-weight: 600; font-size: clamp(1.75rem, 1rem + 3vw, 3.25rem); line-height: 1.15; margin: 0; max-width: 52rem; }
.st-run .st-big { margin-top: 0; color: var(--st-accent); }
.st-caret { display: inline-block; width: 0.08em; height: 0.9em; margin-left: 0.06em; vertical-align: -0.08em; background: currentColor; animation: st-blink 1s steps(1) infinite; }
@keyframes st-blink { 50% { opacity: 0; } }
.st-source { margin-top: 2.5rem; font-size: 0.875rem; color: var(--st-soft); max-width: 34rem; }

/* 4. logged */
.st-logged { min-height: 70dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.st-paper { position: absolute; inset: -50vh -50vw; background: var(--st-paper); }
.st-stamp { position: relative; display: grid; transform-origin: center; }
.st-stamp > span { grid-area: 1 / 1; font-family: var(--font-display); font-weight: 700; font-size: clamp(3.5rem, 1rem + 12vw, 10rem); line-height: 1; letter-spacing: -0.04em; }
.st-stamp-word { color: var(--color-app-ink); position: relative; }
.st-echo { color: transparent; -webkit-text-stroke: 1.5px var(--st-panel); }
.st-record {
  position: relative; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem;
  margin-top: 2.5rem; width: min(100%, 32rem); padding: 0.875rem 1rem;
  background: var(--st-paper); border: 1px solid var(--color-app-line); border-radius: 0.5rem;
  color: var(--color-app-ink); font-weight: 600;
}

/* 5. the pattern */
.st-pattern { text-align: center; }
.st-rides { list-style: none; padding: 0; margin: 0 auto 2.5rem; display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; }
.st-rides li { font-family: var(--font-mono); font-size: clamp(0.875rem, 0.8rem + 0.3vw, 1rem); padding: 0.5rem 0.875rem; border: 1px solid var(--st-faint); border-radius: 999px; color: var(--st-paper); }
.st-wipe { display: grid; }
.st-wipe > p { grid-area: 1 / 1; margin: 0; padding: 0.15em 0.3em; font-family: var(--font-display); font-weight: 700; font-size: clamp(2.5rem, 1rem + 7.5vw, 7rem); line-height: 1.05; letter-spacing: -0.035em; }
.st-wipe-base { color: var(--st-soft); }
.st-wipe-panel { background: var(--st-panel); color: var(--st-paper); }

/* the bar: chapter progress and the skip link */
.st-bar {
  position: fixed; left: 50%; bottom: max(1rem, env(safe-area-inset-bottom)); z-index: 30;
  display: flex; align-items: center; gap: 1rem; padding: 0.5rem 0.5rem 0.5rem 1rem;
  background: color-mix(in oklab, var(--color-app-ink) 88%, transparent); color: var(--st-paper);
  border: 1px solid var(--st-faint); border-radius: 999px; backdrop-filter: blur(8px);
  transform: translate(-50%, 160%); opacity: 0; pointer-events: none;
  transition: transform 320ms cubic-bezier(0.23, 1, 0.32, 1), opacity 200ms ease;
}
.st-bar-on, .st-bar:focus-within { transform: translate(-50%, 0); opacity: 1; pointer-events: auto; }
.st-progress { display: flex; gap: 4px; list-style: none; margin: 0; padding: 0; }
.st-progress li { width: 18px; height: 3px; border-radius: 2px; background: var(--st-faint); transition: background 200ms ease; }
.st-progress li.st-progress-on { background: var(--st-accent); }
.st-bar-label { font-size: 0.8125rem; white-space: nowrap; color: var(--st-soft); }
.st-skip {
  display: inline-flex; align-items: center; min-height: 44px; padding: 0 1rem; border-radius: 999px;
  background: var(--st-paper); color: var(--color-app-ink); font-weight: 600; font-size: 0.875rem; text-decoration: none;
  white-space: nowrap;
}
.st-skip:focus-visible { outline: 3px solid var(--st-accent); outline-offset: 2px; }
@media (max-width: 520px) { .st-bar-label { display: none; } }

/* Reduced motion: no pinning, no travel. Each chapter is a plain block in its finished state. */
.st-still .st-pin { position: static; height: auto; min-height: 0; padding: 5rem 1.5rem; }
.st-still .st-paper { display: none; }
.st-still .st-light { background: var(--st-paper); }
.st-still .st-caret { display: none; }
`
