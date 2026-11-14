import assert from 'node:assert/strict'
import { test } from 'node:test'
import { groupLines } from '../src/three/lines.ts'

const word = (start: number, end: number, left: number, top: number) => ({ start, end, left, right: left + (end - start) * 10, top, bottom: top + 40 })

test('words on one line make a single run from the first to the last', () => {
  assert.deepEqual(groupLines([word(0, 3, 0, 100), word(4, 15, 40, 100)]), [{ start: 0, end: 15, left: 0, right: 150, top: 100, bottom: 140 }])
})

test('a word that wraps starts a new run', () => {
  const runs = groupLines([word(0, 3, 0, 100), word(4, 15, 40, 100), word(16, 20, 0, 150)])
  assert.equal(runs.length, 2)
  assert.deepEqual(runs[1], { start: 16, end: 20, left: 0, right: 40, top: 150, bottom: 190 })
})

test('a pixel of jitter in the top edge stays on the same line', () => {
  assert.equal(groupLines([word(0, 3, 0, 100), word(4, 8, 40, 101.5)]).length, 1)
})

test('no words, no runs', () => {
  assert.deepEqual(groupLines([]), [])
})
