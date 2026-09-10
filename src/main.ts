import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'
import {
	displayScore,
	gameStatus,
	initialGame,
	scorePoint,
	type Player,
	winner,
} from './game.js'
import { explicit as track, fx, implicit as derive } from './slank.js'

const elements = {
	scoreA: document.querySelector<HTMLElement>('#score-a')!,
	scoreB: document.querySelector<HTMLElement>('#score-b')!,
	status: document.querySelector<HTMLElement>('#status')!,
	pointButtons: document.querySelectorAll<HTMLButtonElement>('[data-player]'),
	resetButton: document.querySelector<HTMLButtonElement>('#reset')!,
}

const game = track(initialGame)

const view = derive(() => ({
	score: displayScore(game.value),
	status: gameStatus(game.value),
	isGameOver: pipe(game.value, winner, O.isSome),
}))

fx(() => {
	elements.scoreA.textContent = view.value.score.a
	elements.scoreB.textContent = view.value.score.b
	elements.status.textContent = view.value.status
	elements.pointButtons.forEach(button => {
		button.disabled = view.value.isGameOver
	})
})

elements.pointButtons.forEach(button => {
	button.addEventListener('click', () => {
		const player = button.dataset.player as Player
		game.value = scorePoint(player)(game.value)
	})
})

elements.resetButton.addEventListener('click', () => (game.value = initialGame))
