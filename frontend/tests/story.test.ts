// Run with `npm test` (Node 22 strips the types; no test framework needed).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clockAngles, flight, smoothstep, street, trackProgress, viewProgress } from '../src/three/story.ts'

test('the pinned street reports how far it has been scrolled through', () => {
  assert.equal(trackProgress(0, 2800, 1000), 0)
  assert.equal(trackProgress(-900, 2800, 1000), 0.5)
  assert.equal(trackProgress(-5000, 2800, 1000), 1)
  assert.equal(trackProgress(300, 2800, 1000), 0, 'not reached yet')
  assert.equal(trackProgress(-50, 500, 1000), 0, 'shorter than the viewport: nothing to scroll')
})

test('an element is 0 as it enters at the bottom and 1 as it leaves at the top', () => {
  assert.equal(viewProgress(1000, 200, 1000), 0)
  assert.equal(viewProgress(400, 200, 1000), 0.5)
  assert.equal(viewProgress(-200, 200, 1000), 1)
  assert.equal(viewProgress(1600, 200, 1000), 0)
  assert.equal(viewProgress(-900, 200, 1000), 1)
})

test('smoothstep eases 0 to 1 through the middle', () => {
  assert.equal(smoothstep(0), 0)
  assert.equal(smoothstep(0.5), 0.5)
  assert.equal(smoothstep(1), 1)
  assert.equal(smoothstep(-3), 0)
  assert.equal(smoothstep(3), 1)
})

test('the street story starts flat and waiting', () => {
  const s = street(0)
  assert.deepEqual(
    { rise: s.rise, vanIn: s.vanIn, vanPast: s.vanPast, verdict: s.verdict, missed: s.missed, phase: s.phase },
    { rise: 0, vanIn: 0, vanPast: 0, verdict: 0, missed: false, phase: 0 },
  )
  assert.equal(s.tilt, 24)
  assert.equal(s.orbit, -16)
})

test('the pieces have stood up by p = 0.15', () => {
  const s = street(0.15)
  assert.equal(s.rise, 1)
  assert.equal(s.tilt, 16)
})

test('the van arrives beside the rider at p = 0.6 and has gone by 0.85', () => {
  assert.equal(street(0.3).vanIn, 0)
  assert.equal(street(0.3).phase, 1)
  assert.equal(street(0.6).vanIn, 1)
  assert.equal(street(0.6).vanPast, 0)
  assert.equal(street(0.6).phase, 2)
  assert.equal(street(0.85).vanPast, 1)
})

test('the appointment is missed from p = 0.85 and the verdict faces the viewer at the end', () => {
  assert.equal(street(0.84).missed, false)
  assert.equal(street(0.85).missed, true)
  assert.equal(street(0.85).phase, 3)
  assert.equal(street(0.85).verdict, 0)
  const end = street(1)
  assert.equal(end.verdict, 1)
  assert.equal(end.tilt, 6)
  assert.equal(end.orbit, 16)
})

test('the street story clamps outside 0..1', () => {
  assert.deepEqual(street(-2), street(0))
  assert.deepEqual(street(5), street(1))
})

test('the clock runs from 9:00 to 9:20 across the story', () => {
  assert.deepEqual(clockAngles(0), { minute: 0, hour: 270 })
  assert.deepEqual(clockAngles(1), { minute: 120, hour: 280 })
  assert.deepEqual(clockAngles(-1), clockAngles(0))
})

test('the hero clock flies from the hero (0) to the street (1)', () => {
  assert.equal(flight(0, 500), 0)
  assert.equal(flight(250, 500), 0.5)
  assert.equal(flight(500, 500), 1)
  assert.equal(flight(2000, 500), 1)
  assert.equal(flight(0, 0), 1, 'street already pinned at the top')
})
