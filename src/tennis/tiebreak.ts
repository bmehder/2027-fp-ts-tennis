import { opponent, type Player } from './player.js'

// Types
export type Tiebreak = Readonly<{
	a: number
	b: number
}>

export type TiebreakWin = Readonly<{
	winner: Player
	score: Tiebreak
}>

export type TiebreakResult =
	| { outcome: 'tiebreakContinues'; tiebreak: Tiebreak }
	| { outcome: 'tiebreakWon'; result: TiebreakWin }

// Initial state
export const initialTiebreak: Tiebreak = {
	a: 0,
	b: 0,
}

// State transition
export const scorePoint =
	(pointWinner: Player) =>
	(tiebreak: Tiebreak): TiebreakResult => {
		const score = {
			...tiebreak,
			[pointWinner]: tiebreak[pointWinner] + 1,
		}

		const isTiebreakWon =
			score[pointWinner] >= 7 &&
			score[pointWinner] - score[opponent(pointWinner)] >= 2

		return isTiebreakWon
			? { outcome: 'tiebreakWon', result: { winner: pointWinner, score } }
			: { outcome: 'tiebreakContinues', tiebreak: score }
	}
