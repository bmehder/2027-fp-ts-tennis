import { opponent, type Player } from './player.js'

// Types
type TiebreakScore = Readonly<{
	a: number
	b: number
}>

export type Tiebreak = Readonly<{
	score: TiebreakScore
}>

export type TiebreakWin = Readonly<{
	winner: Player
	score: TiebreakScore
}>

export type TiebreakResult =
	| { outcome: 'tiebreakContinues'; tiebreak: Tiebreak }
	| { outcome: 'tiebreakWon'; result: TiebreakWin }

// Initial state
export const initialTiebreak: Tiebreak = {
	score: { a: 0, b: 0 },
}

// State transition
export const scorePoint =
	(pointWinner: Player) =>
	(tiebreak: Tiebreak): TiebreakResult => {
		const score = {
			...tiebreak.score,
			[pointWinner]: tiebreak.score[pointWinner] + 1,
		}

		const isTiebreakWon =
			score[pointWinner] >= 7 &&
			score[pointWinner] - score[opponent(pointWinner)] >= 2

		return isTiebreakWon
			? { outcome: 'tiebreakWon', result: { winner: pointWinner, score } }
			: { outcome: 'tiebreakContinues', tiebreak: { score } }
	}
