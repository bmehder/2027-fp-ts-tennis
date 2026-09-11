import * as O from 'fp-ts/Option'
import { map } from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/function'
import { match } from 'ts-pattern'
import { displayScore } from './game.js'
import { initialMatch, scorePoint, type Match } from './match.js'
import { type Player } from './player.js'
import {
	score as setScore,
	type Set,
	type SetResult,
	type SetScore,
} from './set.js'
import { explicit as track, fx, implicit as derive } from './slank.js'

const elements = {
	setScoresA: document.querySelectorAll<HTMLElement>('[data-set-player="a"]'),
	setScoresB: document.querySelectorAll<HTMLElement>('[data-set-player="b"]'),
	tiebreakScoresA: document.querySelectorAll<HTMLElement>(
		'[data-tiebreak-player="a"]',
	),
	tiebreakScoresB: document.querySelectorAll<HTMLElement>(
		'[data-tiebreak-player="b"]',
	),
	pointsA: document.querySelector<HTMLElement>('#points-a')!,
	pointsB: document.querySelector<HTMLElement>('#points-b')!,
	appState: document.querySelector<HTMLElement>('#app-state')!,
	pointButtons: document.querySelectorAll<HTMLButtonElement>('[data-player]'),
	resetButton: document.querySelector<HTMLButtonElement>('#reset')!,
}

// Application
type Message =
	| { type: 'pointWon'; pointWinner: Player }
	| { type: 'restart' }

const update =
	(message: Message) =>
	(model: Match): Match =>
		match(message)
			.returnType<Match>()
			.with({ type: 'pointWon' }, ({ pointWinner }) =>
				scorePoint(pointWinner)(model),
			)
			.with({ type: 'restart' }, () => initialMatch)
			.exhaustive()

const model = track(initialMatch)

// View
type PlayerSetScoreView = Readonly<{
	games: string
	tiebreakScore: O.Option<string>
}>

type SetScoreView = Readonly<Record<Player, PlayerSetScoreView>>

const emptySetScoreView: SetScoreView = {
	a: { games: '', tiebreakScore: O.none },
	b: { games: '', tiebreakScore: O.none },
}

const setScoreView = (score: SetScore): SetScoreView => ({
	a: { games: score.a.toString(), tiebreakScore: O.none },
	b: { games: score.b.toString(), tiebreakScore: O.none },
})

const completedSetView = (result: SetResult): SetScoreView =>
	match(result)
		.returnType<SetScoreView>()
		.with({ kind: 'decidedByGames' }, ({ score }) => setScoreView(score))
		.with(
			{ kind: 'decidedByTiebreak', score: { a: 7, b: 6 } },
			({ tiebreakLoserScore }) => ({
				a: { games: '7', tiebreakScore: O.none },
				b: {
					games: '6',
					tiebreakScore: O.some(tiebreakLoserScore.toString()),
				},
			}),
		)
		.with(
			{ kind: 'decidedByTiebreak', score: { a: 6, b: 7 } },
			({ tiebreakLoserScore }) => ({
				a: {
					games: '6',
					tiebreakScore: O.some(tiebreakLoserScore.toString()),
				},
				b: { games: '7', tiebreakScore: O.none },
			}),
		)
		.exhaustive()

const currentSetView = (set: Set): SetScoreView =>
	pipe(set, setScore, setScoreView)

const matchView = (tennisMatch: Match) =>
	match(tennisMatch)
		.with({ state: 'completed' }, ({ completedSets }) => ({
			sets: map(completedSetView)(completedSets),
			points: { a: '', b: '' },
			isMatchOver: true,
		}))
		.with(
			{ state: 'inProgress', set: { state: 'tiebreak' } },
			({ completedSets, set }) => ({
				sets: [...map(completedSetView)(completedSets), currentSetView(set)],
				points: set.tiebreak.score,
				isMatchOver: false,
			}),
		)
		.with(
			{ state: 'inProgress', set: { state: 'regularGame' } },
			({ completedSets, set }) => ({
				sets: [...map(completedSetView)(completedSets), currentSetView(set)],
				points: displayScore(set.game),
				isMatchOver: false,
			}),
		)
		.exhaustive()

const view = derive(() => matchView(model.value))

fx(() => {
	elements.setScoresA.forEach((element, index) => {
		const set = pipe(
			view.value.sets[index],
			O.fromNullable,
			O.getOrElse(() => emptySetScoreView),
		)
		element.textContent = set.a.games
		elements.tiebreakScoresA[index]!.textContent = pipe(
			set.a.tiebreakScore,
			O.getOrElse(() => ''),
		)
	})
	elements.setScoresB.forEach((element, index) => {
		const set = pipe(
			view.value.sets[index],
			O.fromNullable,
			O.getOrElse(() => emptySetScoreView),
		)
		element.textContent = set.b.games
		elements.tiebreakScoresB[index]!.textContent = pipe(
			set.b.tiebreakScore,
			O.getOrElse(() => ''),
		)
	})
	elements.pointsA.textContent = view.value.points.a.toString()
	elements.pointsB.textContent = view.value.points.b.toString()
	elements.appState.textContent = JSON.stringify(model.value, null, 2)
	elements.pointButtons.forEach(button => {
		button.disabled = view.value.isMatchOver
	})
})

elements.pointButtons.forEach(button => {
	button.addEventListener('click', () => {
		model.value = update({
			type: 'pointWon',
			pointWinner: button.dataset.player as Player,
		})(model.value)
	})
})

elements.resetButton.addEventListener(
	'click',
	() => (model.value = update({ type: 'restart' })(model.value)),
)
