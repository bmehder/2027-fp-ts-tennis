import * as O from 'fp-ts/Option'
import { match } from 'ts-pattern'
import { opponent, type Player } from './player.js'
import {
	initialSet,
	scorePoint as scoreSetPoint,
	toSetScore,
	type Set,
	type SetResult,
	type SetScore,
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

const firstServer: Player = 'a'

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
	setResult: SetResult,
): Match => {
	const completedSets = [...tennisMatch.completedSets, setResult]

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

const gamesPlayed = (score: SetScore): number => score.a + score.b

const completedGames = (sets: readonly SetResult[]): number =>
	sets.reduce((total, set) => total + gamesPlayed(set.score), 0)

const alternateServer = (server: Player, changes: number): Player =>
	changes % 2 === 0 ? server : opponent(server)

const tiebreakServer = (
	tiebreakFirstServer: Player,
	pointsPlayed: number,
): Player =>
	alternateServer(tiebreakFirstServer, Math.floor((pointsPlayed + 1) / 2))

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

// Query
export const currentServer = (tennisMatch: Match): O.Option<Player> => {
	switch (tennisMatch.state) {
		case 'completed':
			return O.none
		case 'inProgress': {
			const gamesBeforeCurrentGame =
				completedGames(tennisMatch.completedSets) +
				gamesPlayed(toSetScore(tennisMatch.set))
			const regularGameServer = alternateServer(
				firstServer,
				gamesBeforeCurrentGame,
			)

			switch (tennisMatch.set.state) {
				case 'playingGame':
					return O.some(regularGameServer)
				case 'playingTiebreak':
					return O.some(
						tiebreakServer(
							regularGameServer,
							tennisMatch.set.tiebreak.a + tennisMatch.set.tiebreak.b,
						),
					)
			}
		}
	}
}
