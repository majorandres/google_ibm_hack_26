import assert from 'node:assert/strict'
import { test } from 'node:test'
import { tiltFor } from '../src/tilt.ts'

const box = { left: 100, top: 100, width: 200, height: 100 }

test('no tilt with the pointer at the centre', () => {
  assert.equal(tiltFor(200, 150, box, 7), null)
})

test('pointer on the right edge: turns about the vertical axis so the right side dips away', () => {
  assert.deepEqual(tiltFor(300, 150, box, 7), { x: 0, y: 1, angle: 7 })
})

test('pointer on the top edge: turns about the horizontal axis so the top dips away', () => {
  assert.deepEqual(tiltFor(200, 100, box, 7), { x: 1, y: 0, angle: 7 })
})

test('corners never exceed the maximum angle', () => {
  assert.deepEqual(tiltFor(300, 200, box, 7), { x: -1, y: 1, angle: 7 })
})

test('halfway to the edge is half the angle', () => {
  assert.deepEqual(tiltFor(250, 150, box, 7), { x: 0, y: 0.5, angle: 3.5 })
})

test('no tilt when the pointer is outside the box', () => {
  assert.equal(tiltFor(90, 150, box, 7), null)
})
