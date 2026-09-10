import * as O from 'fp-ts/Option'
import { P, match } from 'ts-pattern'

// Types
export type Player = 'a' | 'b'

export type PointScore = 'love' | 'fifteen' | 'thirty' | 'forty'

export type Game =
	| { state: 'notStarted' }
	| { state: 'playing'; a: PointScore; b: PointScore }
	| { state: 'deuce' }
	| { state: 'advantage'; advantagedPlayer: Player }
	| { state: 'won'; gameWinner: Player }

export type Score = {
	a: string
	b: string
}

// Helper types and functions
const pointLabel = (pointScore: PointScore): string =>
	match(pointScore)
		.with('love', () => '0')
		.with('fifteen', () => '15')
		.with('thirty', () => '30')
		.with('forty', () => '40')
		.exhaustive()

const assertNever = (value: never): never => {
	throw new Error(`Unexpected value: ${JSON.stringify(value)}`)
}

type AdvanceablePointScore = Exclude<PointScore, 'forty'>

const advancePointScore = (pointScore: AdvanceablePointScore): PointScore => {
	switch (pointScore) {
		case 'love':
			return 'fifteen'
		case 'fifteen':
			return 'thirty'
		case 'thirty':
			return 'forty'
		default:
			return assertNever(pointScore)
	}
}

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

type PlayingGame = Extract<Game, { state: 'playing' }>

const scorePlaying = (game: PlayingGame, pointWinner: Player): Game =>
	match({
		pointWinner,
		pointWinnerScore: game[pointWinner],
		opponentScore: game[opponent(pointWinner)],
	})
		.returnType<Game>()
		.with({ pointWinnerScore: 'forty' }, () => won(pointWinner))
		.with({ pointWinnerScore: 'thirty', opponentScore: 'forty' }, () => ({
			state: 'deuce',
		}))
		.with(
			{ pointWinner: 'a', pointWinnerScore: P.not('forty') },
			({ pointWinnerScore }) =>
				playing(advancePointScore(pointWinnerScore), game.b),
		)
		.with(
			{ pointWinner: 'b', pointWinnerScore: P.not('forty') },
			({ pointWinnerScore }) =>
				playing(game.a, advancePointScore(pointWinnerScore)),
		)
		.exhaustive()

// Initial state
export const initialGame: Game = {
	state: 'notStarted',
}

// State transition
export const scorePoint =
	(pointWinner: Player) =>
	(game: Game): Game => {
		switch (game.state) {
			case 'notStarted':
				return pointWinner === 'a'
					? playing('fifteen', 'love')
					: playing('love', 'fifteen')
			case 'playing':
				return scorePlaying(game, pointWinner)
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

// Queries and projections
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

export const gameStatus = (game: Game): string => {
	switch (game.state) {
		case 'notStarted':
			return 'Ready? Play.'
		case 'won':
			return `Game, Player ${game.gameWinner.toUpperCase()}!`
		case 'playing':
			return 'Game in progress'
		case 'deuce':
			return 'Deuce'
		case 'advantage':
			return `Advantage Player ${game.advantagedPlayer.toLocaleUpperCase()}`
		default:
			return assertNever(game)
	}
}
