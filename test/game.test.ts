import test from 'node:test'
import assert from 'node:assert/strict'
import * as O from 'fp-ts/Option'
import { displayScore, initialGame, scorePoint, winner } from '../src/game.js'
import { type Player } from '../src/player.js'

const play = (points: Player[]) =>
	points.reduce((game, player) => scorePoint(player)(game), initialGame)

test('starts at love all and enters play on the first point', () => {
	assert.equal(initialGame, 'loveLove')
	assert.deepEqual(displayScore(initialGame), { a: '0', b: '0' })
	assert.equal(scorePoint('a')(initialGame), 'fifteenLove')
})

test('moves through ordinary tennis scores', () => {
	assert.deepEqual(displayScore(play(['a', 'a', 'b'])), { a: '30', b: '15' })
})

test('handles deuce and advantage', () => {
	const deuce = play(['a', 'a', 'a', 'b', 'b', 'b'])
	const advantage = scorePoint('a')(deuce)

	assert.equal(deuce, 'deuce')
	assert.deepEqual(displayScore(deuce), { a: '40', b: '40' })
	assert.equal(advantage, 'advantageA')
	assert.deepEqual(displayScore(advantage), { a: 'AD', b: '40' })
})

test('requires two clear points to win and then stops scoring', () => {
	const won = play(['a', 'a', 'a', 'b', 'b', 'b', 'a', 'a'])
	assert.equal(O.getOrElse(() => 'nobody')(winner(won)), 'a')
	assert.deepEqual(displayScore(won), { a: '', b: '' })
	assert.equal(scorePoint('b')(won), won)
})

test('hides the score after both ordinary and deuce wins', () => {
	assert.deepEqual(displayScore(play(['a', 'a', 'a', 'a'])), { a: '', b: '' })
	assert.deepEqual(
		displayScore(play(['a', 'a', 'a', 'b', 'b', 'b', 'a', 'a'])),
		{ a: '', b: '' },
	)
})

test('returns to deuce when the player without advantage wins the point', () => {
	const game = play(['a', 'a', 'a', 'b', 'b', 'b', 'a', 'b'])
	assert.equal(game, 'deuce')
})
