import * as O from 'fp-ts/Option'
import { match, P } from 'ts-pattern'
import { type Game, type Player, type PointIndex, type Score } from './types.js'

// Private vocabulary supporting the public state-machine API.
const pointLabel = (pointIndex: PointIndex) =>
	['0', '15', '30', '40'][pointIndex]

const advancePlayingPoint = (
	pointIndex: Exclude<PointIndex, 3>,
): PointIndex =>
	match(pointIndex)
		.returnType<PointIndex>()
		.with(0, () => 1)
		.with(1, () => 2)
		.with(2, () => 3)
		.exhaustive()

const playing = (a: PointIndex, b: PointIndex) => ({
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
	game[pointWinner] === 3
		? won(pointWinner)
		: game[pointWinner] === 2 && game[opponent(pointWinner)] === 3
			? { state: 'deuce' }
			: pointWinner === 'a'
				? playing(advancePlayingPoint(game[pointWinner]), game.b)
				: playing(game.a, advancePlayingPoint(game[pointWinner]))

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
				pointWinner === 'a' ? playing(1, 0) : playing(0, 1),
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
