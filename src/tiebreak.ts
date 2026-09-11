import * as O from 'fp-ts/Option'
import { opponent, type Player } from './player.js'

// Types
export type TiebreakScore = Readonly<{
	a: number
	b: number
}>

export type Tiebreak =
	| { state: 'playing'; score: TiebreakScore }
	| { state: 'won'; tiebreakWinner: Player; score: TiebreakScore }

// Helper types and functions
type PlayingTiebreak = Extract<Tiebreak, { state: 'playing' }>

const scorePlayingTiebreak = (
	tiebreak: PlayingTiebreak,
	pointWinner: Player,
): Tiebreak => {
	const score = {
		...tiebreak.score,
		[pointWinner]: tiebreak.score[pointWinner] + 1,
	}

	const isTiebreakWon =
		score[pointWinner] >= 7 &&
		score[pointWinner] - score[opponent(pointWinner)] >= 2

	return isTiebreakWon
		? { state: 'won', tiebreakWinner: pointWinner, score }
		: { state: 'playing', score }
}

// Initial state
export const initialTiebreak: Tiebreak = {
	state: 'playing',
	score: { a: 0, b: 0 },
}

// State transition
export const scorePoint =
	(pointWinner: Player) =>
	(tiebreak: Tiebreak): Tiebreak => {
		switch (tiebreak.state) {
			case 'playing':
				return scorePlayingTiebreak(tiebreak, pointWinner)
			case 'won':
				return tiebreak
		}
	}

// Queries and projections
export const winner = (tiebreak: Tiebreak): O.Option<Player> => {
	switch (tiebreak.state) {
		case 'won':
			return O.some(tiebreak.tiebreakWinner)
		case 'playing':
			return O.none
	}
}

export const score = (tiebreak: Tiebreak): TiebreakScore => tiebreak.score
