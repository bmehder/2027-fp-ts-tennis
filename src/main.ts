import { match } from 'ts-pattern'
import { displayScore, gameStatus } from './game.js'
import { initialMatch, scorePoint, type Match } from './match.js'
import { type Player } from './player.js'
import { score as setScore, type SetResult, type SetScore } from './set.js'
import { explicit as track, fx, implicit as derive } from './slank.js'

const elements = {
	setScoresA: document.querySelectorAll<HTMLElement>('[data-set-player="a"]'),
	setScoresB: document.querySelectorAll<HTMLElement>('[data-set-player="b"]'),
	pointsA: document.querySelector<HTMLElement>('#points-a')!,
	pointsB: document.querySelector<HTMLElement>('#points-b')!,
	status: document.querySelector<HTMLElement>('#status')!,
	appState: document.querySelector<HTMLElement>('#app-state')!,
	pointButtons: document.querySelectorAll<HTMLButtonElement>('[data-player]'),
	resetButton: document.querySelector<HTMLButtonElement>('#reset')!,
}

const tennisMatch = track(initialMatch)

type DisplaySet = SetResult | { kind: 'inProgress'; score: SetScore }

const inProgress = (score: SetScore): DisplaySet => ({
	kind: 'inProgress',
	score,
})

const matchView = (tennisMatch: Match) =>
	match(tennisMatch)
		.with({ state: 'won' }, ({ completedSets, matchWinner }) => ({
			sets: completedSets,
			points: { a: '', b: '' },
			status: `Match, Player ${matchWinner.toUpperCase()}!`,
			isMatchOver: true,
		}))
		.with(
			{ state: 'playing', set: { state: 'tiebreak' } },
			({ completedSets, set }) => ({
				sets: [...completedSets, inProgress(setScore(set))],
				points: set.tiebreak.score,
				status: 'Tiebreak',
				isMatchOver: false,
			}),
		)
		.with(
			{ state: 'playing', set: { state: 'won' } },
			({ completedSets, set }) => ({
				sets: [...completedSets, inProgress(setScore(set))],
				points: { a: '', b: '' },
				status: `Set, Player ${set.setWinner.toUpperCase()}!`,
				isMatchOver: false,
			}),
		)
		.with(
			{ state: 'playing', set: { state: 'playing' } },
			({ completedSets, set }) => ({
				sets: [...completedSets, inProgress(setScore(set))],
				points: displayScore(set.game),
				status: gameStatus(set.game),
				isMatchOver: false,
			}),
		)
		.exhaustive()

const view = derive(() => matchView(tennisMatch.value))

const displaySetScore = (
	element: HTMLElement,
	set: DisplaySet | undefined,
	player: Player,
) => {
	if (!set) return element.replaceChildren()

	element.replaceChildren(set.score[player].toString())

	if (set.kind === 'tiebreak' && set.score[player] === 6) {
		const tiebreakScore = document.createElement('sup')
		tiebreakScore.textContent = set.tiebreakLoserScore.toString()
		element.append(tiebreakScore)
	}
}

fx(() => {
	elements.setScoresA.forEach((element, index) => {
		displaySetScore(element, view.value.sets[index], 'a')
	})
	elements.setScoresB.forEach((element, index) => {
		displaySetScore(element, view.value.sets[index], 'b')
	})
	elements.pointsA.textContent = view.value.points.a.toString()
	elements.pointsB.textContent = view.value.points.b.toString()
	elements.status.textContent = view.value.status
	elements.appState.textContent = JSON.stringify(tennisMatch.value, null, 2)
	elements.pointButtons.forEach(button => {
		button.disabled = view.value.isMatchOver
	})
})

elements.pointButtons.forEach(button => {
	button.addEventListener('click', () => {
		const player = button.dataset.player as Player
		tennisMatch.value = scorePoint(player)(tennisMatch.value)
	})
})

elements.resetButton.addEventListener(
	'click',
	() => (tennisMatch.value = initialMatch),
)
