import { type Player } from './player.js'

// Types
export type Game =
	| 'loveLove'
	| 'loveFifteen'
	| 'fifteenLove'
	| 'loveThirty'
	| 'thirtyLove'
	| 'fifteenFifteen'
	| 'loveForty'
	| 'fortyLove'
	| 'fifteenThirty'
	| 'thirtyFifteen'
	| 'fifteenForty'
	| 'fortyFifteen'
	| 'thirtyThirty'
	| 'thirtyForty'
	| 'fortyThirty'
	| 'deuce'
	| 'advantageA'
	| 'advantageB'

export type GameResult =
	| { outcome: 'gameContinues'; game: Game }
	| { outcome: 'gameWon'; gameWinner: Player }

type GameScore = Readonly<{
	a: string
	b: string
}>

type GameTransitions = Readonly<
	Record<Game, Readonly<Record<Player, GameResult>>>
>

// Helper functions
const continues = (game: Game): GameResult => ({
	outcome: 'gameContinues',
	game,
})

const won = (gameWinner: Player): GameResult => ({
	outcome: 'gameWon',
	gameWinner,
})

// State transitions
const transitions = {
	loveLove: { a: continues('fifteenLove'), b: continues('loveFifteen') },
	loveFifteen: {
		a: continues('fifteenFifteen'),
		b: continues('loveThirty'),
	},
	fifteenLove: {
		a: continues('thirtyLove'),
		b: continues('fifteenFifteen'),
	},
	loveThirty: { a: continues('fifteenThirty'), b: continues('loveForty') },
	thirtyLove: { a: continues('fortyLove'), b: continues('thirtyFifteen') },
	fifteenFifteen: {
		a: continues('thirtyFifteen'),
		b: continues('fifteenThirty'),
	},
	loveForty: { a: continues('fifteenForty'), b: won('b') },
	fortyLove: { a: won('a'), b: continues('fortyFifteen') },
	fifteenThirty: {
		a: continues('thirtyThirty'),
		b: continues('fifteenForty'),
	},
	thirtyFifteen: {
		a: continues('fortyFifteen'),
		b: continues('thirtyThirty'),
	},
	fifteenForty: { a: continues('thirtyForty'), b: won('b') },
	fortyFifteen: { a: won('a'), b: continues('fortyThirty') },
	thirtyThirty: {
		a: continues('fortyThirty'),
		b: continues('thirtyForty'),
	},
	thirtyForty: { a: continues('deuce'), b: won('b') },
	fortyThirty: { a: won('a'), b: continues('deuce') },
	deuce: { a: continues('advantageA'), b: continues('advantageB') },
	advantageA: { a: won('a'), b: continues('deuce') },
	advantageB: { a: continues('deuce'), b: won('b') },
} as const satisfies GameTransitions

// Display scores
const displayScores = {
	loveLove: { a: '0', b: '0' },
	loveFifteen: { a: '0', b: '15' },
	fifteenLove: { a: '15', b: '0' },
	loveThirty: { a: '0', b: '30' },
	thirtyLove: { a: '30', b: '0' },
	fifteenFifteen: { a: '15', b: '15' },
	loveForty: { a: '0', b: '40' },
	fortyLove: { a: '40', b: '0' },
	fifteenThirty: { a: '15', b: '30' },
	thirtyFifteen: { a: '30', b: '15' },
	fifteenForty: { a: '15', b: '40' },
	fortyFifteen: { a: '40', b: '15' },
	thirtyThirty: { a: '30', b: '30' },
	thirtyForty: { a: '30', b: '40' },
	fortyThirty: { a: '40', b: '30' },
	deuce: { a: '40', b: '40' },
	advantageA: { a: 'AD', b: '40' },
	advantageB: { a: '40', b: 'AD' },
} as const satisfies Readonly<Record<Game, GameScore>>

// Initial state
export const initialGame: Game = 'loveLove'

// State transition
export const scorePoint =
	(pointWinner: Player) =>
	(game: Game): GameResult =>
		transitions[game][pointWinner]

// Projection
export const displayScore = (game: Game): GameScore => displayScores[game]
