import test from 'node:test'
import assert from 'node:assert/strict'
import * as O from 'fp-ts/Option'
import { type Player } from '../src/tennis/player.js'
import {
	currentServer,
	initialMatch,
	scorePoint,
	type Match,
} from '../src/tennis/match.js'

const playFrom = (tennisMatch: Match, points: Player[]): Match =>
	points.reduce(
		(currentMatch, player) => scorePoint(player)(currentMatch),
		tennisMatch,
	)

const play = (points: Player[]): Match => playFrom(initialMatch, points)

const gameWonBy = (player: Player): Player[] => [player, player, player, player]

test('alternates the server after each regular game', () => {
	assert.deepEqual(currentServer(initialMatch), O.some('a'))
	assert.deepEqual(currentServer(play(['a', 'a', 'a'])), O.some('a'))
	assert.deepEqual(currentServer(play(gameWonBy('a'))), O.some('b'))
	assert.deepEqual(
		currentServer(play([...gameWonBy('a'), ...gameWonBy('b')])),
		O.some('a'),
	)
})

test('uses the tennis serving order during and after a tiebreak', () => {
	const twelveGames = Array.from({ length: 12 }, (_, index) =>
		gameWonBy(index % 2 === 0 ? 'a' : 'b'),
	).flat()
	const atTiebreak = play(twelveGames)

	assert.deepEqual(currentServer(atTiebreak), O.some('a'))
	assert.deepEqual(currentServer(playFrom(atTiebreak, ['a'])), O.some('b'))
	assert.deepEqual(currentServer(playFrom(atTiebreak, ['a', 'a'])), O.some('b'))
	assert.deepEqual(
		currentServer(playFrom(atTiebreak, ['a', 'a', 'a'])),
		O.some('a'),
	)
	assert.deepEqual(
		currentServer(playFrom(atTiebreak, Array<Player>(7).fill('a'))),
		O.some('b'),
	)
})

test('wins a best-of-three match after two sets', () => {
	const points = Array<Player>(48).fill('a')
	const tennisMatch = play(points)

	assert.ok(tennisMatch.state === 'completed')
	assert.equal(tennisMatch.matchWinner, 'a')
	assert.ok(O.isNone(currentServer(tennisMatch)))
	assert.deepEqual(tennisMatch.completedSets, [
		{ kind: 'decidedByGames', score: { a: 6, b: 0 } },
		{ kind: 'decidedByGames', score: { a: 6, b: 0 } },
	])
})

test('plays a third set when the players split the first two', () => {
	const setWonByA = Array<Player>(24).fill('a')
	const setWonByB = Array<Player>(24).fill('b')
	const afterTwoSets = play([...setWonByA, ...setWonByB])

	assert.equal(afterTwoSets.state, 'inProgress')

	const tennisMatch = [...setWonByA].reduce<Match>(
		(currentMatch, player) => scorePoint(player)(currentMatch),
		afterTwoSets,
	)

	assert.ok(tennisMatch.state === 'completed')
	assert.equal(tennisMatch.matchWinner, 'a')
	assert.deepEqual(tennisMatch.completedSets, [
		{ kind: 'decidedByGames', score: { a: 6, b: 0 } },
		{ kind: 'decidedByGames', score: { a: 0, b: 6 } },
		{ kind: 'decidedByGames', score: { a: 6, b: 0 } },
	])
})
