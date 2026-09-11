import * as O from 'fp-ts/Option'
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
	| 'wonA'
	| 'wonB'

type GameScore = Readonly<{
	a: string
	b: string
}>

type GameTransitions = Readonly<
	Record<Game, Readonly<Record<Player, Game>>>
>

// State transitions
const transitions = {
	loveLove: { a: 'fifteenLove', b: 'loveFifteen' },
	loveFifteen: { a: 'fifteenFifteen', b: 'loveThirty' },
	fifteenLove: { a: 'thirtyLove', b: 'fifteenFifteen' },
	loveThirty: { a: 'fifteenThirty', b: 'loveForty' },
	thirtyLove: { a: 'fortyLove', b: 'thirtyFifteen' },
	fifteenFifteen: { a: 'thirtyFifteen', b: 'fifteenThirty' },
	loveForty: { a: 'fifteenForty', b: 'wonB' },
	fortyLove: { a: 'wonA', b: 'fortyFifteen' },
	fifteenThirty: { a: 'thirtyThirty', b: 'fifteenForty' },
	thirtyFifteen: { a: 'fortyFifteen', b: 'thirtyThirty' },
	fifteenForty: { a: 'thirtyForty', b: 'wonB' },
	fortyFifteen: { a: 'wonA', b: 'fortyThirty' },
	thirtyThirty: { a: 'fortyThirty', b: 'thirtyForty' },
	thirtyForty: { a: 'deuce', b: 'wonB' },
	fortyThirty: { a: 'wonA', b: 'deuce' },
	deuce: { a: 'advantageA', b: 'advantageB' },
	advantageA: { a: 'wonA', b: 'deuce' },
	advantageB: { a: 'deuce', b: 'wonB' },
	wonA: { a: 'wonA', b: 'wonA' },
	wonB: { a: 'wonB', b: 'wonB' },
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
	wonA: { a: '', b: '' },
	wonB: { a: '', b: '' },
} as const satisfies Readonly<Record<Game, GameScore>>

// Initial state
export const initialGame: Game = 'loveLove'

// State transition
export const scorePoint =
	(pointWinner: Player) =>
	(game: Game): Game =>
		transitions[game][pointWinner]

// Queries and projections
export const winner = (game: Game): O.Option<Player> => {
	switch (game) {
		case 'wonA':
			return O.some('a')
		case 'wonB':
			return O.some('b')
		default:
			return O.none
	}
}

export const displayScore = (game: Game): GameScore => displayScores[game]
