import * as O from 'fp-ts/Option'
import { match, P } from 'ts-pattern'
import {
	type Game,
	type Player,
	type PointScore,
	type Score,
} from './game.point-score.js'

// Private vocabulary supporting the public state-machine API.
const pointLabel = (pointScore: PointScore): string =>
	match(pointScore)
		.with('love', () => '0')
		.with('fifteen', () => '15')
		.with('thirty', () => '30')
		.with('forty', () => '40')
		.exhaustive()

const advancePointScore = (
	pointScore: Exclude<PointScore, 'forty'>,
): PointScore =>
	match(pointScore)
		.returnType<PointScore>()
		.with('love', () => 'fifteen')
		.with('fifteen', () => 'thirty')
		.with('thirty', () => 'forty')
		.exhaustive()

const playing = (a: PointScore, b: PointScore) => ({
	state: 'playing' as const,
	a,
	b,
})

const advantage = (advantagedPlayer: Player): Game => ({
	state: 'advantage',
	advantagedPlayer,
})

const won = (gameWinner: Player): Game => ({ state: 'won', gameWinner })

const opponent = (player: Player): Player => (player === 'a' ? 'b' : 'a')

const scorePlayingGame = (
	game: Extract<Game, { state: 'playing' }>,
	pointWinner: Player,
): Game =>
	game[pointWinner] === 'forty'
		? won(pointWinner)
		: game[pointWinner] === 'thirty' &&
			  game[opponent(pointWinner)] === 'forty'
			? { state: 'deuce' }
			: pointWinner === 'a'
				? playing(advancePointScore(game[pointWinner]), game.b)
				: playing(game.a, advancePointScore(game[pointWinner]))

// Game is the state machine; initialGame is its starting state.
export const initialGame: Game = {
	state: 'notStarted',
}

// scorePoint is the transition function.
export const scorePoint =
	(pointWinner: Player) =>
	(game: Game): Game =>
		match(game)
			.returnType<Game>()
			.with({ state: 'notStarted' }, () =>
				pointWinner === 'a'
					? playing('fifteen', 'love')
					: playing('love', 'fifteen'),
			)
			.with({ state: 'playing' }, game =>
				scorePlayingGame(game, pointWinner),
			)
			.with({ state: 'deuce' }, () => advantage(pointWinner))
			.with({ state: 'advantage' }, game =>
				game.advantagedPlayer === pointWinner
					? won(pointWinner)
					: { state: 'deuce' },
			)
			.with({ state: 'won' }, game => game)
			.exhaustive()

// Queries and projections derive information.
export const winner = (game: Game): O.Option<Player> =>
	match(game)
		.returnType<O.Option<Player>>()
		.with({ state: 'won' }, ({ gameWinner }) => O.some(gameWinner))
		.with(
			{ state: P.union('notStarted', 'playing', 'deuce', 'advantage') },
			() => O.none,
		)
		.exhaustive()

export const displayScore = (game: Game): Score =>
	match(game)
		.returnType<Score>()
		.with({ state: 'notStarted' }, () => ({ a: '0', b: '0' }))
		.with({ state: 'playing' }, ({ a, b }) => ({
			a: pointLabel(a),
			b: pointLabel(b),
		}))
		.with({ state: 'deuce' }, () => ({ a: '40', b: '40' }))
		.with({ state: 'advantage', advantagedPlayer: 'a' }, () => ({
			a: 'AD',
			b: '40',
		}))
		.with({ state: 'advantage', advantagedPlayer: 'b' }, () => ({
			a: '40',
			b: 'AD',
		}))
		.with({ state: 'won' }, () => ({ a: '', b: '' }))
		.exhaustive()

export const gameStatus = (game: Game): string =>
	match(game)
		.with({ state: 'notStarted' }, () => 'Ready? Play!')
		.with(
			{ state: 'won' },
			({ gameWinner }) => `Game, Player ${gameWinner.toUpperCase()}!`,
		)
		.with(
			{ state: P.union('playing', 'deuce', 'advantage') },
			() => 'Game in progress',
		)
		.exhaustive()
