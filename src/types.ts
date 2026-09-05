export type Player = 'a' | 'b'

export type Point = 0 | 1 | 2 | 3

export type Game =
	| { state: 'notStarted' }
	| { state: 'playing'; a: Point; b: Point }
	| { state: 'deuce' }
	| { state: 'advantage'; advantagedPlayer: Player }
	| { state: 'won'; gameWinner: Player }

export type Score = {
	a: string
	b: string
}
