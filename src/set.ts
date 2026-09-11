import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import {
	initialGame,
	scorePoint as scoreGamePoint,
	type Game,
	winner as gameWinner,
} from './game.js'
import { type Player } from './player.js'
import {
	initialTiebreak,
	scorePoint as scoreTiebreakPoint,
	type Tiebreak,
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
	| { kind: 'regular'; score: SetScore }
	| {
			kind: 'tiebreak'
			score: Readonly<{ a: 7; b: 6 } | { a: 6; b: 7 }>
			tiebreakLoserScore: number
	  }

export type Set =
	| { state: 'playing'; games: SetGameScore; game: Game }
	| { state: 'tiebreak'; tiebreak: Tiebreak }
	| { state: 'won'; setWinner: Player; result: SetResult }

type SetTransitions = Readonly<
	Record<SetGameScore, Readonly<Record<Player, Set>>>
>

// Helper functions
const playing = (games: SetGameScore): Set => ({
	state: 'playing',
	games,
	game: initialGame,
})

const tiebreak = (): Set => ({
	state: 'tiebreak',
	tiebreak: initialTiebreak,
})

const won = (setWinner: Player, a: SetScoreValue, b: SetScoreValue): Set => ({
	state: 'won',
	setWinner,
	result: { kind: 'regular', score: { a, b } },
})

const wonInTiebreak = (
	setWinner: Player,
	tiebreak: Extract<Tiebreak, { state: 'won' }>,
): Set => ({
	state: 'won',
	setWinner,
	result:
		setWinner === 'a'
			? {
					kind: 'tiebreak',
					score: { a: 7, b: 6 },
					tiebreakLoserScore: tiebreak.score.b,
				}
			: {
					kind: 'tiebreak',
					score: { a: 6, b: 7 },
					tiebreakLoserScore: tiebreak.score.a,
				},
})

// Set transitions after a completed game
const transitions = {
	loveLove: { a: playing('oneLove'), b: playing('loveOne') },
	loveOne: { a: playing('oneOne'), b: playing('loveTwo') },
	loveTwo: { a: playing('oneTwo'), b: playing('loveThree') },
	loveThree: { a: playing('oneThree'), b: playing('loveFour') },
	loveFour: { a: playing('oneFour'), b: playing('loveFive') },
	loveFive: { a: playing('oneFive'), b: won('b', 0, 6) },
	oneLove: { a: playing('twoLove'), b: playing('oneOne') },
	oneOne: { a: playing('twoOne'), b: playing('oneTwo') },
	oneTwo: { a: playing('twoTwo'), b: playing('oneThree') },
	oneThree: { a: playing('twoThree'), b: playing('oneFour') },
	oneFour: { a: playing('twoFour'), b: playing('oneFive') },
	oneFive: { a: playing('twoFive'), b: won('b', 1, 6) },
	twoLove: { a: playing('threeLove'), b: playing('twoOne') },
	twoOne: { a: playing('threeOne'), b: playing('twoTwo') },
	twoTwo: { a: playing('threeTwo'), b: playing('twoThree') },
	twoThree: { a: playing('threeThree'), b: playing('twoFour') },
	twoFour: { a: playing('threeFour'), b: playing('twoFive') },
	twoFive: { a: playing('threeFive'), b: won('b', 2, 6) },
	threeLove: { a: playing('fourLove'), b: playing('threeOne') },
	threeOne: { a: playing('fourOne'), b: playing('threeTwo') },
	threeTwo: { a: playing('fourTwo'), b: playing('threeThree') },
	threeThree: { a: playing('fourThree'), b: playing('threeFour') },
	threeFour: { a: playing('fourFour'), b: playing('threeFive') },
	threeFive: { a: playing('fourFive'), b: won('b', 3, 6) },
	fourLove: { a: playing('fiveLove'), b: playing('fourOne') },
	fourOne: { a: playing('fiveOne'), b: playing('fourTwo') },
	fourTwo: { a: playing('fiveTwo'), b: playing('fourThree') },
	fourThree: { a: playing('fiveThree'), b: playing('fourFour') },
	fourFour: { a: playing('fiveFour'), b: playing('fourFive') },
	fourFive: { a: playing('fiveFive'), b: won('b', 4, 6) },
	fiveLove: { a: won('a', 6, 0), b: playing('fiveOne') },
	fiveOne: { a: won('a', 6, 1), b: playing('fiveTwo') },
	fiveTwo: { a: won('a', 6, 2), b: playing('fiveThree') },
	fiveThree: { a: won('a', 6, 3), b: playing('fiveFour') },
	fiveFour: { a: won('a', 6, 4), b: playing('fiveFive') },
	fiveFive: { a: playing('sixFive'), b: playing('fiveSix') },
	sixFive: { a: won('a', 7, 5), b: tiebreak() },
	fiveSix: { a: tiebreak(), b: won('b', 5, 7) },
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
export const initialSet: Set = playing('loveLove')

// State transition
export const scorePoint =
	(pointWinner: Player) =>
	(set: Set): Set => {
		switch (set.state) {
			case 'playing': {
				const game = scoreGamePoint(pointWinner)(set.game)

				return pipe(
					gameWinner(game),
					O.match(
						() => ({ ...set, game }),
						winner => transitions[set.games][winner],
					),
				)
			}
			case 'tiebreak': {
				const tiebreak = scoreTiebreakPoint(pointWinner)(set.tiebreak)

				switch (tiebreak.state) {
					case 'playing':
						return { ...set, tiebreak }
					case 'won':
						return wonInTiebreak(tiebreak.tiebreakWinner, tiebreak)
				}
			}
			case 'won':
				return set
		}
	}

// Queries and projections
export const score = (set: Set): SetScore => {
	switch (set.state) {
		case 'playing':
			return scores[set.games]
		case 'tiebreak':
			return { a: 6, b: 6 }
		case 'won':
			return set.result.score
	}
}
