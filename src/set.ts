import { match } from 'ts-pattern'
import {
	initialGame,
	scorePoint as scoreGamePoint,
	type Game,
} from './game.js'
import { type Player } from './player.js'
import {
	initialTiebreak,
	scorePoint as scoreTiebreakPoint,
	type Tiebreak,
	type TiebreakWin,
} from './tiebreak.js'

// Types
type SetGameScore =
	| 'loveLove'
	| 'loveOne'
	| 'loveTwo'
	| 'loveThree'
	| 'loveFour'
	| 'loveFive'
	| 'oneLove'
	| 'oneOne'
	| 'oneTwo'
	| 'oneThree'
	| 'oneFour'
	| 'oneFive'
	| 'twoLove'
	| 'twoOne'
	| 'twoTwo'
	| 'twoThree'
	| 'twoFour'
	| 'twoFive'
	| 'threeLove'
	| 'threeOne'
	| 'threeTwo'
	| 'threeThree'
	| 'threeFour'
	| 'threeFive'
	| 'fourLove'
	| 'fourOne'
	| 'fourTwo'
	| 'fourThree'
	| 'fourFour'
	| 'fourFive'
	| 'fiveLove'
	| 'fiveOne'
	| 'fiveTwo'
	| 'fiveThree'
	| 'fiveFour'
	| 'fiveFive'
	| 'sixFive'
	| 'fiveSix'

type SetScoreValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export type SetScore = Readonly<{
	a: SetScoreValue
	b: SetScoreValue
}>

export type SetResult =
	| { kind: 'decidedByGames'; score: SetScore }
	| {
			kind: 'decidedByTiebreak'
			score: Readonly<{ a: 7; b: 6 } | { a: 6; b: 7 }>
			tiebreakLoserScore: number
	  }

export type Set =
	| { state: 'regularGame'; games: SetGameScore; game: Game }
	| { state: 'tiebreak'; tiebreak: Tiebreak }

export type SetTransition =
	| { outcome: 'setContinues'; set: Set }
	| { outcome: 'setWon'; setWinner: Player; result: SetResult }

type SetTransitions = Readonly<
	Record<SetGameScore, Readonly<Record<Player, SetTransition>>>
>

// Helper functions
const regularGame = (games: SetGameScore): Set => ({
	state: 'regularGame',
	games,
	game: initialGame,
})

const tiebreak = (): Set => ({
	state: 'tiebreak',
	tiebreak: initialTiebreak,
})

const continues = (set: Set): SetTransition => ({
	outcome: 'setContinues',
	set,
})

const won = (
	setWinner: Player,
	a: SetScoreValue,
	b: SetScoreValue,
): SetTransition => ({
	outcome: 'setWon',
	setWinner,
	result: { kind: 'decidedByGames', score: { a, b } },
})

const wonInTiebreak = (result: TiebreakWin): SetTransition =>
	match(result)
		.returnType<SetTransition>()
		.with({ winner: 'a' }, ({ score }) => ({
			outcome: 'setWon',
			setWinner: 'a',
			result: {
				kind: 'decidedByTiebreak',
				score: { a: 7, b: 6 },
				tiebreakLoserScore: score.b,
			},
		}))
		.with({ winner: 'b' }, ({ score }) => ({
			outcome: 'setWon',
			setWinner: 'b',
			result: {
				kind: 'decidedByTiebreak',
				score: { a: 6, b: 7 },
				tiebreakLoserScore: score.a,
			},
		}))
		.exhaustive()

// Set transitions after a completed game
const transitions = {
	loveLove: { a: continues(regularGame('oneLove')), b: continues(regularGame('loveOne')) },
	loveOne: { a: continues(regularGame('oneOne')), b: continues(regularGame('loveTwo')) },
	loveTwo: { a: continues(regularGame('oneTwo')), b: continues(regularGame('loveThree')) },
	loveThree: { a: continues(regularGame('oneThree')), b: continues(regularGame('loveFour')) },
	loveFour: { a: continues(regularGame('oneFour')), b: continues(regularGame('loveFive')) },
	loveFive: { a: continues(regularGame('oneFive')), b: won('b', 0, 6) },
	oneLove: { a: continues(regularGame('twoLove')), b: continues(regularGame('oneOne')) },
	oneOne: { a: continues(regularGame('twoOne')), b: continues(regularGame('oneTwo')) },
	oneTwo: { a: continues(regularGame('twoTwo')), b: continues(regularGame('oneThree')) },
	oneThree: { a: continues(regularGame('twoThree')), b: continues(regularGame('oneFour')) },
	oneFour: { a: continues(regularGame('twoFour')), b: continues(regularGame('oneFive')) },
	oneFive: { a: continues(regularGame('twoFive')), b: won('b', 1, 6) },
	twoLove: { a: continues(regularGame('threeLove')), b: continues(regularGame('twoOne')) },
	twoOne: { a: continues(regularGame('threeOne')), b: continues(regularGame('twoTwo')) },
	twoTwo: { a: continues(regularGame('threeTwo')), b: continues(regularGame('twoThree')) },
	twoThree: { a: continues(regularGame('threeThree')), b: continues(regularGame('twoFour')) },
	twoFour: { a: continues(regularGame('threeFour')), b: continues(regularGame('twoFive')) },
	twoFive: { a: continues(regularGame('threeFive')), b: won('b', 2, 6) },
	threeLove: { a: continues(regularGame('fourLove')), b: continues(regularGame('threeOne')) },
	threeOne: { a: continues(regularGame('fourOne')), b: continues(regularGame('threeTwo')) },
	threeTwo: { a: continues(regularGame('fourTwo')), b: continues(regularGame('threeThree')) },
	threeThree: { a: continues(regularGame('fourThree')), b: continues(regularGame('threeFour')) },
	threeFour: { a: continues(regularGame('fourFour')), b: continues(regularGame('threeFive')) },
	threeFive: { a: continues(regularGame('fourFive')), b: won('b', 3, 6) },
	fourLove: { a: continues(regularGame('fiveLove')), b: continues(regularGame('fourOne')) },
	fourOne: { a: continues(regularGame('fiveOne')), b: continues(regularGame('fourTwo')) },
	fourTwo: { a: continues(regularGame('fiveTwo')), b: continues(regularGame('fourThree')) },
	fourThree: { a: continues(regularGame('fiveThree')), b: continues(regularGame('fourFour')) },
	fourFour: { a: continues(regularGame('fiveFour')), b: continues(regularGame('fourFive')) },
	fourFive: { a: continues(regularGame('fiveFive')), b: won('b', 4, 6) },
	fiveLove: { a: won('a', 6, 0), b: continues(regularGame('fiveOne')) },
	fiveOne: { a: won('a', 6, 1), b: continues(regularGame('fiveTwo')) },
	fiveTwo: { a: won('a', 6, 2), b: continues(regularGame('fiveThree')) },
	fiveThree: { a: won('a', 6, 3), b: continues(regularGame('fiveFour')) },
	fiveFour: { a: won('a', 6, 4), b: continues(regularGame('fiveFive')) },
	fiveFive: { a: continues(regularGame('sixFive')), b: continues(regularGame('fiveSix')) },
	sixFive: { a: won('a', 7, 5), b: continues(tiebreak()) },
	fiveSix: { a: continues(tiebreak()), b: won('b', 5, 7) },
} as const satisfies SetTransitions

// Display scores
const scores = {
	loveLove: { a: 0, b: 0 },
	loveOne: { a: 0, b: 1 },
	loveTwo: { a: 0, b: 2 },
	loveThree: { a: 0, b: 3 },
	loveFour: { a: 0, b: 4 },
	loveFive: { a: 0, b: 5 },
	oneLove: { a: 1, b: 0 },
	oneOne: { a: 1, b: 1 },
	oneTwo: { a: 1, b: 2 },
	oneThree: { a: 1, b: 3 },
	oneFour: { a: 1, b: 4 },
	oneFive: { a: 1, b: 5 },
	twoLove: { a: 2, b: 0 },
	twoOne: { a: 2, b: 1 },
	twoTwo: { a: 2, b: 2 },
	twoThree: { a: 2, b: 3 },
	twoFour: { a: 2, b: 4 },
	twoFive: { a: 2, b: 5 },
	threeLove: { a: 3, b: 0 },
	threeOne: { a: 3, b: 1 },
	threeTwo: { a: 3, b: 2 },
	threeThree: { a: 3, b: 3 },
	threeFour: { a: 3, b: 4 },
	threeFive: { a: 3, b: 5 },
	fourLove: { a: 4, b: 0 },
	fourOne: { a: 4, b: 1 },
	fourTwo: { a: 4, b: 2 },
	fourThree: { a: 4, b: 3 },
	fourFour: { a: 4, b: 4 },
	fourFive: { a: 4, b: 5 },
	fiveLove: { a: 5, b: 0 },
	fiveOne: { a: 5, b: 1 },
	fiveTwo: { a: 5, b: 2 },
	fiveThree: { a: 5, b: 3 },
	fiveFour: { a: 5, b: 4 },
	fiveFive: { a: 5, b: 5 },
	sixFive: { a: 6, b: 5 },
	fiveSix: { a: 5, b: 6 },
} as const satisfies Readonly<Record<SetGameScore, SetScore>>

// Initial state
export const initialSet: Set = regularGame('loveLove')

// State transition
export const scorePoint =
	(pointWinner: Player) =>
	(set: Set): SetTransition => {
		switch (set.state) {
			case 'regularGame':
				return match(scoreGamePoint(pointWinner)(set.game))
					.returnType<SetTransition>()
					.with({ outcome: 'gameContinues' }, ({ game }) =>
						continues({ ...set, game }),
					)
					.with(
						{ outcome: 'gameWon' },
						({ gameWinner }) => transitions[set.games][gameWinner],
					)
					.exhaustive()
			case 'tiebreak':
				return match(scoreTiebreakPoint(pointWinner)(set.tiebreak))
					.returnType<SetTransition>()
					.with({ outcome: 'tiebreakContinues' }, ({ tiebreak }) =>
						continues({ ...set, tiebreak }),
					)
					.with({ outcome: 'tiebreakWon' }, ({ result }) =>
						wonInTiebreak(result),
					)
					.exhaustive()
		}
	}

// Queries and projections
export const score = (set: Set): SetScore => {
	switch (set.state) {
		case 'regularGame':
			return scores[set.games]
		case 'tiebreak':
			return { a: 6, b: 6 }
	}
}
