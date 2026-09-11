import test from 'node:test'
import assert from 'node:assert/strict'
import { type Player } from '../src/player.js'
import { initialTiebreak, scorePoint } from '../src/tiebreak.js'

const play = (points: Player[]) =>
	points.reduce((tiebreak, player) => scorePoint(player)(tiebreak), initialTiebreak)

test('wins a tiebreak at seven points with a two-point lead', () => {
	const tiebreak = play(['a', 'a', 'a', 'a', 'a', 'a', 'a'])

	assert.ok(tiebreak.state === 'won')
	assert.equal(tiebreak.tiebreakWinner, 'a')
})

test('continues beyond six all until a player leads by two', () => {
	const tiebreak = play([
		'a', 'b', 'a', 'b', 'a', 'b', 'a', 'b', 'a', 'b', 'a', 'b',
		'a', 'b', 'b', 'b',
	])

	assert.ok(tiebreak.state === 'won')
	assert.equal(tiebreak.tiebreakWinner, 'b')
	assert.deepEqual(tiebreak.score, { a: 7, b: 9 })
})

test('retains an extended tiebreak score such as fourteen twelve', () => {
	const twelveAll = Array.from(
		{ length: 12 },
		() => ['a', 'b'] as Player[],
	).flat()
	const tiebreak = play([...twelveAll, 'a', 'a'])

	assert.ok(tiebreak.state === 'won')
	assert.equal(tiebreak.tiebreakWinner, 'a')
	assert.deepEqual(tiebreak.score, { a: 14, b: 12 })
})
