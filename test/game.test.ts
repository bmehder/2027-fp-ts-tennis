import test from 'node:test'
import assert from 'node:assert/strict'
import {
	displayScore,
	initialGame,
	scorePoint,
	type GameResult,
} from '../src/tennis/game.js'
import { type Player } from '../src/tennis/player.js'

const play = (points: Player[]): GameResult =>
	points.reduce<GameResult>(
		(result, player) =>
			result.outcome === 'gameContinues'
				? scorePoint(player)(result.game)
				: result,
		{ outcome: 'gameContinues', game: initialGame },
	)

test('starts at love all and enters play on the first point', () => {
	assert.equal(initialGame, 'loveLove')
	assert.deepEqual(displayScore(initialGame), { a: '0', b: '0' })
	assert.deepEqual(scorePoint('a')(initialGame), {
		outcome: 'gameContinues',
		game: 'fifteenLove',
	})
})

test('moves through ordinary tennis scores', () => {
	const result = play(['a', 'a', 'b'])

	assert.ok(result.outcome === 'gameContinues')
	assert.deepEqual(displayScore(result.game), { a: '30', b: '15' })
})

test('handles deuce and advantage', () => {
	const deuce = play(['a', 'a', 'a', 'b', 'b', 'b'])
	assert.ok(deuce.outcome === 'gameContinues')

	const advantage = scorePoint('a')(deuce.game)
	assert.equal(deuce.game, 'deuce')
	assert.deepEqual(displayScore(deuce.game), { a: '40', b: '40' })
	assert.deepEqual(advantage, {
		outcome: 'gameContinues',
		game: 'advantageA',
	})
})

test('requires two clear points to win', () => {
	assert.deepEqual(play(['a', 'a', 'a', 'b', 'b', 'b', 'a', 'a']), {
		outcome: 'gameWon',
		gameWinner: 'a',
	})
})

test('returns a win result after both ordinary and deuce games', () => {
	assert.deepEqual(play(['a', 'a', 'a', 'a']), {
		outcome: 'gameWon',
		gameWinner: 'a',
	})
	assert.deepEqual(play(['a', 'a', 'a', 'b', 'b', 'b', 'a', 'a']), {
		outcome: 'gameWon',
		gameWinner: 'a',
	})
})

test('returns to deuce when the player without advantage wins the point', () => {
	assert.deepEqual(play(['a', 'a', 'a', 'b', 'b', 'b', 'a', 'b']), {
		outcome: 'gameContinues',
		game: 'deuce',
	})
})
