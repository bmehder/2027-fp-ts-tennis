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
	| { state: 'playingGame'; games: SetGameScore; game: Game }
	| { state: 'playingTiebreak'; tiebreak: Tiebreak }

export type SetTransition =
	| { outcome: 'setContinues'; set: Set }
	| { outcome: 'setWon'; setWinner: Player; result: SetResult }

type SetTransitions = Readonly<
	Record<SetGameScore, Readonly<Record<Player, SetTransition>>>
>

// Helper functions
const playingGame = (games: SetGameScore): Set => ({
	state: 'playingGame',
	games,
	game: initialGame,
})

const playingTiebreak = (): Set => ({
	state: 'playingTiebreak',
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
	loveLove: { a: continues(playingGame('oneLove')), b: continues(playingGame('loveOne')) },
	loveOne: { a: continues(playingGame('oneOne')), b: continues(playingGame('loveTwo')) },
	loveTwo: { a: continues(playingGame('oneTwo')), b: continues(playingGame('loveThree')) },
	loveThree: { a: continues(playingGame('oneThree')), b: continues(playingGame('loveFour')) },
	loveFour: { a: continues(playingGame('oneFour')), b: continues(playingGame('loveFive')) },
	loveFive: { a: continues(playingGame('oneFive')), b: won('b', 0, 6) },
	oneLove: { a: continues(playingGame('twoLove')), b: continues(playingGame('oneOne')) },
	oneOne: { a: continues(playingGame('twoOne')), b: continues(playingGame('oneTwo')) },
	oneTwo: { a: continues(playingGame('twoTwo')), b: continues(playingGame('oneThree')) },
	oneThree: { a: continues(playingGame('twoThree')), b: continues(playingGame('oneFour')) },
	oneFour: { a: continues(playingGame('twoFour')), b: continues(playingGame('oneFive')) },
	oneFive: { a: continues(playingGame('twoFive')), b: won('b', 1, 6) },
	twoLove: { a: continues(playingGame('threeLove')), b: continues(playingGame('twoOne')) },
	twoOne: { a: continues(playingGame('threeOne')), b: continues(playingGame('twoTwo')) },
	twoTwo: { a: continues(playingGame('threeTwo')), b: continues(playingGame('twoThree')) },
	twoThree: { a: continues(playingGame('threeThree')), b: continues(playingGame('twoFour')) },
	twoFour: { a: continues(playingGame('threeFour')), b: continues(playingGame('twoFive')) },
	twoFive: { a: continues(playingGame('threeFive')), b: won('b', 2, 6) },
	threeLove: { a: continues(playingGame('fourLove')), b: continues(playingGame('threeOne')) },
	threeOne: { a: continues(playingGame('fourOne')), b: continues(playingGame('threeTwo')) },
	threeTwo: { a: continues(playingGame('fourTwo')), b: continues(playingGame('threeThree')) },
	threeThree: { a: continues(playingGame('fourThree')), b: continues(playingGame('threeFour')) },
	threeFour: { a: continues(playingGame('fourFour')), b: continues(playingGame('threeFive')) },
	threeFive: { a: continues(playingGame('fourFive')), b: won('b', 3, 6) },
	fourLove: { a: continues(playingGame('fiveLove')), b: continues(playingGame('fourOne')) },
	fourOne: { a: continues(playingGame('fiveOne')), b: continues(playingGame('fourTwo')) },
	fourTwo: { a: continues(playingGame('fiveTwo')), b: continues(playingGame('fourThree')) },
	fourThree: { a: continues(playingGame('fiveThree')), b: continues(playingGame('fourFour')) },
	fourFour: { a: continues(playingGame('fiveFour')), b: continues(playingGame('fourFive')) },
	fourFive: { a: continues(playingGame('fiveFive')), b: won('b', 4, 6) },
	fiveLove: { a: won('a', 6, 0), b: continues(playingGame('fiveOne')) },
	fiveOne: { a: won('a', 6, 1), b: continues(playingGame('fiveTwo')) },
	fiveTwo: { a: won('a', 6, 2), b: continues(playingGame('fiveThree')) },
	fiveThree: { a: won('a', 6, 3), b: continues(playingGame('fiveFour')) },
	fiveFour: { a: won('a', 6, 4), b: continues(playingGame('fiveFive')) },
	fiveFive: { a: continues(playingGame('sixFive')), b: continues(playingGame('fiveSix')) },
	sixFive: { a: won('a', 7, 5), b: continues(playingTiebreak()) },
	fiveSix: { a: continues(playingTiebreak()), b: won('b', 5, 7) },
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
export const initialSet: Set = playingGame('loveLove')

// State transition
export const scorePoint =
	(pointWinner: Player) =>
	(set: Set): SetTransition => {
		switch (set.state) {
			case 'playingGame':
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
			case 'playingTiebreak':
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
export const toSetScore = (set: Set): SetScore => {
	switch (set.state) {
		case 'playingGame':
			return scores[set.games]
		case 'playingTiebreak':
			return { a: 6, b: 6 }
	}
}
