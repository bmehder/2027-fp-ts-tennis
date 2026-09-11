export type Player = 'a' | 'b'

export const opponent = (player: Player): Player => {
	switch (player) {
		case 'a':
			return 'b'
		case 'b':
			return 'a'
	}
}
