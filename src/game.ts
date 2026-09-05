import * as O from 'fp-ts/Option'
import { type Game, type Player, type Point, type Score } from './types.js'

// Private vocabulary supporting the public state-machine API.
const pointLabel = (point: Point) => ['0', '15', '30', '40'][point]

const assertNever = (value: never): never => {
	throw new Error(`Unexpected value: ${JSON.stringify(value)}`)
}

const advancePlayingPoint = (point: Exclude<Point, 3>): Point => {
	switch (point) {
		case 0:
			return 1
		case 1:
			return 2
		case 2:
			return 3
		default:
			return assertNever(point)
	}
}

const playing = (a: Point, b: Point) => ({ state: 'playing' as const, a, b })

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
	(game: Game): Game => {
		switch (game.state) {
			case 'notStarted':
				return pointWinner === 'a' ? playing(1, 0) : playing(0, 1)
			case 'playing':
				return scorePlayingGame(game, pointWinner)
			case 'deuce':
				return advantage(pointWinner)
			case 'advantage':
				return game.advantagedPlayer === pointWinner
					? won(pointWinner)
					: { state: 'deuce' }
			case 'won':
				return game
			default:
				return assertNever(game)
		}
	}

// Queries and projections derive information.
export const winner = (game: Game): O.Option<Player> => {
	switch (game.state) {
		case 'won':
			return O.some(game.gameWinner)
		case 'notStarted':
		case 'playing':
		case 'deuce':
		case 'advantage':
			return O.none
		default:
			return assertNever(game)
	}
}

export const displayScore = (game: Game): Score => {
	switch (game.state) {
		case 'notStarted':
			return { a: '0', b: '0' }
		case 'playing':
			return { a: pointLabel(game.a), b: pointLabel(game.b) }
		case 'deuce':
			return { a: '40', b: '40' }
		case 'advantage':
			return game.advantagedPlayer === 'a'
				? { a: 'AD', b: '40' }
				: { a: '40', b: 'AD' }
		case 'won':
			return { a: '', b: '' }
		default:
			return assertNever(game)
	}
}

export const gameStatus = (game: Game): string => {
	switch (game.state) {
		case 'notStarted':
			return 'Ready? Play!'
		case 'won':
			return `Game, Player ${game.gameWinner.toUpperCase()}!`
		case 'playing':
		case 'deuce':
		case 'advantage':
			return 'Game in progress'
		default:
			return assertNever(game)
	}
}
