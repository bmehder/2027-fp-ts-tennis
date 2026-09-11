import test from 'node:test'
import assert from 'node:assert/strict'
import * as O from 'fp-ts/Option'
import { type Player } from '../src/player.js'
import { initialSet, score, scorePoint, winner } from '../src/set.js'

const gameWonBy = (player: Player): Player[] => [player, player, player, player]

const play = (points: Player[]) =>
	points.reduce((set, player) => scorePoint(player)(set), initialSet)

test('wins a set at six games with a two-game lead', () => {
	const set = play(Array.from({ length: 6 }, () => gameWonBy('a')).flat())

	assert.equal(O.toUndefined(winner(set)), 'a')
	assert.deepEqual(score(set), { a: 6, b: 0 })
})

test('plays a tiebreak at six games all', () => {
	const games = Array.from({ length: 12 }, (_, index) =>
		gameWonBy(index % 2 === 0 ? 'a' : 'b'),
	).flat()
	const set = play([...games, ...Array<Player>(7).fill('a')])

	assert.equal(O.toUndefined(winner(set)), 'a')
	assert.deepEqual(score(set), { a: 7, b: 6 })
})
