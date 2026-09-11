import test from 'node:test'
import assert from 'node:assert/strict'
import * as O from 'fp-ts/Option'
import { type Player } from '../src/player.js'
import { initialMatch, scorePoint, winner } from '../src/match.js'

const play = (points: Player[]) =>
	points.reduce(
		(tennisMatch, player) => scorePoint(player)(tennisMatch),
		initialMatch,
	)

test('wins a best-of-three match after two sets', () => {
	const points = Array<Player>(48).fill('a')
	const tennisMatch = play(points)

	assert.equal(O.toUndefined(winner(tennisMatch)), 'a')
	assert.deepEqual(tennisMatch.completedSets, [
		{ kind: 'regular', score: { a: 6, b: 0 } },
		{ kind: 'regular', score: { a: 6, b: 0 } },
	])
})

test('plays a third set when the players split the first two', () => {
	const setWonByA = Array<Player>(24).fill('a')
	const setWonByB = Array<Player>(24).fill('b')
	const afterTwoSets = play([...setWonByA, ...setWonByB])

	assert.ok(O.isNone(winner(afterTwoSets)))

	const tennisMatch = [...setWonByA].reduce(
		(currentMatch, player) => scorePoint(player)(currentMatch),
		afterTwoSets,
	)

	assert.equal(O.toUndefined(winner(tennisMatch)), 'a')
	assert.deepEqual(tennisMatch.completedSets, [
		{ kind: 'regular', score: { a: 6, b: 0 } },
		{ kind: 'regular', score: { a: 0, b: 6 } },
		{ kind: 'regular', score: { a: 6, b: 0 } },
	])
})
