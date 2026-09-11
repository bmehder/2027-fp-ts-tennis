import * as O from 'fp-ts/Option'
import { match, P } from 'ts-pattern'
import { type Player } from './player.js'
import {
	initialSet,
	scorePoint as scoreSetPoint,
	type Set,
	type SetScore,
} from './set.js'

// Types
type MatchScore = 'loveLove' | 'oneLove' | 'loveOne' | 'oneOne'

export type Match =
	| {
			state: 'playing'
			score: MatchScore
			completedSets: readonly SetScore[]
			set: Set
	  }
	| {
			state: 'won'
			matchWinner: Player
			completedSets: readonly SetScore[]
	  }

type MatchTransition =
	| { state: 'playing'; score: MatchScore }
	| { state: 'won'; matchWinner: Player }

type MatchTransitions = Readonly<
	Record<MatchScore, Readonly<Record<Player, MatchTransition>>>
>

// Match transitions after a completed set
const transitions = {
	loveLove: {
		a: { state: 'playing', score: 'oneLove' },
		b: { state: 'playing', score: 'loveOne' },
	},
	oneLove: {
		a: { state: 'won', matchWinner: 'a' },
		b: { state: 'playing', score: 'oneOne' },
	},
	loveOne: {
		a: { state: 'playing', score: 'oneOne' },
		b: { state: 'won', matchWinner: 'b' },
	},
	oneOne: {
		a: { state: 'won', matchWinner: 'a' },
		b: { state: 'won', matchWinner: 'b' },
	},
} as const satisfies MatchTransitions

// Helper types and functions
type PlayingMatch = Extract<Match, { state: 'playing' }>
type WonSet = Extract<Set, { state: 'won' }>

const completeSet = (tennisMatch: PlayingMatch, set: WonSet): Match => {
	const completedSets = [...tennisMatch.completedSets, set.score]

	return match(transitions[tennisMatch.score][set.setWinner])
		.returnType<Match>()
		.with({ state: 'playing' }, ({ score }) => ({
			state: 'playing',
			score,
			completedSets,
			set: initialSet,
		}))
		.with({ state: 'won' }, ({ matchWinner }) => ({
			state: 'won',
			matchWinner,
			completedSets,
		}))
		.exhaustive()
}

const scorePlayingMatch = (
	tennisMatch: PlayingMatch,
	pointWinner: Player,
): Match =>
	match(scoreSetPoint(pointWinner)(tennisMatch.set))
		.returnType<Match>()
		.with({ state: 'won' }, set => completeSet(tennisMatch, set))
		.with({ state: P.union('playing', 'tiebreak') }, set => ({
			...tennisMatch,
			set,
		}))
		.exhaustive()

// Initial state
export const initialMatch: Match = {
	state: 'playing',
	score: 'loveLove',
	completedSets: [],
	set: initialSet,
}

// State transition
export const scorePoint =
	(pointWinner: Player) =>
	(tennisMatch: Match): Match => {
		switch (tennisMatch.state) {
			case 'playing':
				return scorePlayingMatch(tennisMatch, pointWinner)
			case 'won':
				return tennisMatch
		}
	}

// Queries
export const winner = (tennisMatch: Match): O.Option<Player> => {
	switch (tennisMatch.state) {
		case 'playing':
			return O.none
		case 'won':
			return O.some(tennisMatch.matchWinner)
	}
}
