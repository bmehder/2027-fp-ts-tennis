import test from 'node:test'
import assert from 'node:assert/strict'
import { explicit, fx, implicit } from '../src/slank.js'

test('recomputes derived signals and effects', () => {
	const count = explicit(1)
	const doubled = implicit(() => count.value * 2)
	const seen: number[] = []

	fx(() => seen.push(doubled.value))
	count.value = 2

	assert.deepEqual(seen, [2, 4])
})
