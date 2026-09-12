import { match } from 'ts-pattern'
import { type Player } from './player.js'
import {
	initialSet,
	scorePoint as scoreSetPoint,
	type Set,
	type SetResult,
} from './set.js'

// Types
type MatchScore = 'loveLove' | 'oneLove' | 'loveOne' | 'oneOne'

type InProgressMatch = {
	state: 'inProgress'
	score: MatchScore
	completedSets: readonly SetResult[]
	set: Set
}

type CompletedMatch = {
	state: 'completed'
	matchWinner: Player
	completedSets: readonly SetResult[]
}

export type Match = InProgressMatch | CompletedMatch

type MatchTransition =
	| { outcome: 'matchContinues'; score: MatchScore }
	| { outcome: 'matchWon'; matchWinner: Player }

type MatchTransitions = Readonly<
	Record<MatchScore, Readonly<Record<Player, MatchTransition>>>
>

// Match transitions after a completed set
const transitions = {
	loveLove: {
		a: { outcome: 'matchContinues', score: 'oneLove' },
		b: { outcome: 'matchContinues', score: 'loveOne' },
	},
	oneLove: {
		a: { outcome: 'matchWon', matchWinner: 'a' },
		b: { outcome: 'matchContinues', score: 'oneOne' },
	},
	loveOne: {
		a: { outcome: 'matchContinues', score: 'oneOne' },
		b: { outcome: 'matchWon', matchWinner: 'b' },
	},
	oneOne: {
		a: { outcome: 'matchWon', matchWinner: 'a' },
		b: { outcome: 'matchWon', matchWinner: 'b' },
	},
} as const satisfies MatchTransitions

// Helper functions
const completeSet = (
	tennisMatch: InProgressMatch,
	setWinner: Player,
	result: SetResult,
): Match => {
	const completedSets = [...tennisMatch.completedSets, result]

	return match(transitions[tennisMatch.score][setWinner])
		.returnType<Match>()
		.with({ outcome: 'matchContinues' }, ({ score }) => ({
			state: 'inProgress',
			score,
			completedSets,
			set: initialSet,
		}))
		.with({ outcome: 'matchWon' }, ({ matchWinner }) => ({
			state: 'completed',
			matchWinner,
			completedSets,
		}))
		.exhaustive()
}

const scoreInProgressMatch = (
	tennisMatch: InProgressMatch,
	pointWinner: Player,
): Match =>
	match(scoreSetPoint(pointWinner)(tennisMatch.set))
		.returnType<Match>()
		.with({ outcome: 'setWon' }, ({ setWinner, result }) =>
			completeSet(tennisMatch, setWinner, result),
		)
		.with({ outcome: 'setContinues' }, ({ set }) => ({
			...tennisMatch,
			set,
		}))
		.exhaustive()

// Initial state
export const initialMatch: Match = {
	state: 'inProgress',
	score: 'loveLove',
	completedSets: [],
	set: initialSet,
}

// State transition
export const scorePoint =
	(pointWinner: Player) =>
	(tennisMatch: Match): Match => {
		switch (tennisMatch.state) {
			case 'inProgress':
				return scoreInProgressMatch(tennisMatch, pointWinner)
			case 'completed':
				return tennisMatch
		}
	}
