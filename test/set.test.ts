import test from 'node:test'
import assert from 'node:assert/strict'
import { type Player } from '../src/tennis/player.js'
import {
	initialSet,
	scorePoint,
	type SetTransition,
} from '../src/tennis/set.js'

const gameWonBy = (player: Player): Player[] => [player, player, player, player]

const play = (points: Player[]): SetTransition =>
	points.reduce<SetTransition>(
		(result, player) =>
			result.outcome === 'setContinues'
				? scorePoint(player)(result.set)
				: result,
		{ outcome: 'setContinues', set: initialSet },
	)

test('wins a set at six games with a two-game lead', () => {
	assert.deepEqual(
		play(Array.from({ length: 6 }, () => gameWonBy('a')).flat()),
		{
			outcome: 'setWon',
			setWinner: 'a',
			result: {
				kind: 'decidedByGames',
				score: { a: 6, b: 0 },
			},
		},
	)
})

test('plays a tiebreak at six games all', () => {
	const games = Array.from({ length: 12 }, (_, index) =>
		gameWonBy(index % 2 === 0 ? 'a' : 'b'),
	).flat()
	const tiebreakPoints: Player[] = [
		'a',
		'b',
		'a',
		'b',
		'a',
		'b',
		'a',
		'b',
		'a',
		'b',
		'a',
		'a',
	]

	assert.deepEqual(play([...games, ...tiebreakPoints]), {
		outcome: 'setWon',
		setWinner: 'a',
		result: {
			kind: 'decidedByTiebreak',
			score: { a: 7, b: 6 },
			tiebreakLoserScore: 5,
		},
	})
})
