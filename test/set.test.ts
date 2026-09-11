import test from 'node:test'
import assert from 'node:assert/strict'
import { type Player } from '../src/player.js'
import { initialSet, score, scorePoint } from '../src/set.js'

const gameWonBy = (player: Player): Player[] => [player, player, player, player]

const play = (points: Player[]) =>
	points.reduce((set, player) => scorePoint(player)(set), initialSet)

test('wins a set at six games with a two-game lead', () => {
	const set = play(Array.from({ length: 6 }, () => gameWonBy('a')).flat())

	assert.ok(set.state === 'won')
	assert.equal(set.setWinner, 'a')
	assert.deepEqual(score(set), { a: 6, b: 0 })
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
	const set = play([...games, ...tiebreakPoints])

	assert.ok(set.state === 'won')
	assert.equal(set.setWinner, 'a')
	assert.deepEqual(score(set), { a: 7, b: 6 })
	assert.deepEqual(set.result, {
		kind: 'tiebreak',
		score: { a: 7, b: 6 },
		tiebreakLoserScore: 5,
	})
})
