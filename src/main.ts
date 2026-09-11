import { match } from 'ts-pattern'
import { displayScore, gameStatus } from './game.js'
import { initialMatch, scorePoint, type Match } from './match.js'
import { type Player } from './player.js'
import { score as setScore } from './set.js'
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
				sets: [...completedSets, setScore(set)],
				points: set.tiebreak.score,
				status: 'Tiebreak',
				isMatchOver: false,
			}),
		)
		.with(
			{ state: 'playing', set: { state: 'won' } },
			({ completedSets, set }) => ({
				sets: [...completedSets, setScore(set)],
				points: { a: '', b: '' },
				status: `Set, Player ${set.setWinner.toUpperCase()}!`,
				isMatchOver: false,
			}),
		)
		.with(
			{ state: 'playing', set: { state: 'playing' } },
			({ completedSets, set }) => ({
				sets: [...completedSets, setScore(set)],
				points: displayScore(set.game),
				status: gameStatus(set.game),
				isMatchOver: false,
			}),
		)
		.exhaustive()

const view = derive(() => matchView(tennisMatch.value))

fx(() => {
	elements.setScoresA.forEach((element, index) => {
		element.textContent = view.value.sets[index]?.a.toString() ?? ''
	})
	elements.setScoresB.forEach((element, index) => {
		element.textContent = view.value.sets[index]?.b.toString() ?? ''
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
