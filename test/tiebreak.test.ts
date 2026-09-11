import test from 'node:test'
import assert from 'node:assert/strict'
import { type Player } from '../src/player.js'
import {
	initialTiebreak,
	scorePoint,
	type TiebreakResult,
} from '../src/tiebreak.js'

const play = (points: Player[]): TiebreakResult =>
	points.reduce<TiebreakResult>(
		(result, player) =>
			result.outcome === 'tiebreakContinues'
				? scorePoint(player)(result.tiebreak)
				: result,
		{ outcome: 'tiebreakContinues', tiebreak: initialTiebreak },
	)

test('wins a tiebreak at seven points with a two-point lead', () => {
	assert.deepEqual(play(['a', 'a', 'a', 'a', 'a', 'a', 'a']), {
		outcome: 'tiebreakWon',
		result: { winner: 'a', score: { a: 7, b: 0 } },
	})
})

test('continues beyond six all until a player leads by two', () => {
	assert.deepEqual(
		play([
			'a', 'b', 'a', 'b', 'a', 'b', 'a', 'b', 'a', 'b', 'a', 'b',
			'a', 'b', 'b', 'b',
		]),
		{
			outcome: 'tiebreakWon',
			result: { winner: 'b', score: { a: 7, b: 9 } },
		},
	)
})

test('retains an extended tiebreak score such as fourteen twelve', () => {
	const twelveAll = Array.from(
		{ length: 12 },
		() => ['a', 'b'] as Player[],
	).flat()

	assert.deepEqual(play([...twelveAll, 'a', 'a']), {
		outcome: 'tiebreakWon',
		result: { winner: 'a', score: { a: 14, b: 12 } },
	})
})
