# When Functions Are Maps: Modeling Tennis with Enumerated States

A function maps an input to an output. One common implementation stores a compact representation and calculates what it means:

```ts
type Player = 'a' | 'b'

type GameInProgress = Readonly<{
	state: 'inProgress'
	points: Readonly<Record<Player, number>>
}>

type Game =
	| GameInProgress
	| { state: 'won'; gameWinner: Player }

const scorePoint =
	(pointWinner: Player) =>
	(game: GameInProgress): Game => {
		const nextPoints = {
			...game.points,
			[pointWinner]: game.points[pointWinner] + 1,
		}
		const pointWinnerScore = nextPoints[pointWinner]
		const opponentScore = nextPoints[opponent(pointWinner)]
		const hasEnoughPoints = pointWinnerScore >= 4
		const hasTwoPointLead = pointWinnerScore - opponentScore >= 2

		return hasEnoughPoints && hasTwoPointLead
			? { state: 'won', gameWinner: pointWinner }
			: { state: 'inProgress', points: nextPoints }
	}
```

This is still a pure function. The issue is that understanding the result requires following a procedure: calculate `nextPoints`, use it to calculate two scores, use those scores to calculate two facts, and then combine those facts to choose the result.

That mental execution is manageable here, but it becomes harder as an algorithm accumulates more temporary values and dependencies between them. Changing the rules also means reasoning about how a new condition interacts with the existing calculation. The code may be concise, yet much of its behavior remains implicit in the procedure.

When the input domain is finite, we can sometimes avoid that procedure and write down the map itself.

The result can be more verbose than an arithmetic implementation, but it is also unusually direct: the source code is a readable description of the scoring rules.

## Enumerate the valid states

A tennis game has a small, finite set of meaningful states. Instead of storing two numbers and interpreting them later, we can name every possible state:

```ts
export type Game =
	| 'loveLove'
	| 'loveFifteen'
	| 'fifteenLove'
	| 'loveThirty'
	| 'thirtyLove'
	| 'fifteenFifteen'
	| 'loveForty'
	| 'fortyLove'
	| 'fifteenThirty'
	| 'thirtyFifteen'
	| 'fifteenForty'
	| 'fortyFifteen'
	| 'thirtyThirty'
	| 'thirtyForty'
	| 'fortyThirty'
	| 'deuce'
	| 'advantageA'
	| 'advantageB'
```

This type is not merely a list of labels. It defines the complete state space of the game. Values such as `fortyFifty`, `advantageAWithThirty`, or `playerAHasFivePoints` cannot be constructed because they are not game states.

The type [makes invalid states unrepresentable](https://youtu.be/IcgmSRJHu_8?si=gu3SwM4HSEbitjqr).

That changes the rest of the program. Functions receiving a `Game` do not need to ask whether both players somehow have advantage, whether a player has forty while the other has advantage, or whether some numeric score is outside the rules. Those values cannot be constructed through the typed domain model, so the core does not need to surround every operation with defensive `if` checks and guards.

Data entering from an untyped boundary may still need to be validated once. Inside the typed program, however, that work does not need to be repeated. Every `Game` can be treated as a valid game.

## Write the function as data

Scoring a point is a function of two inputs:

```text
current game × point winner → next game
```

Both input sets are finite. A player is either A or B, and `Game` contains a fixed set of states. We can therefore write the entire function as a lookup table:

```ts
export type Player = 'a' | 'b'

type GameTransitions = Readonly<
	Record<Game, Readonly<Record<Player, GameResult>>>
>

type GameResult =
	| { outcome: 'gameContinues'; game: Game }
	| { outcome: 'gameWon'; gameWinner: Player }

const continues = (game: Game): GameResult => ({
	outcome: 'gameContinues',
	game,
})

const won = (gameWinner: Player): GameResult => ({
	outcome: 'gameWon',
	gameWinner,
})

const transitions = {
	loveLove: {
		a: continues('fifteenLove'),
		b: continues('loveFifteen'),
	},
	thirtyForty: {
		a: continues('deuce'),
		b: won('b'),
	},
	deuce: {
		a: continues('advantageA'),
		b: continues('advantageB'),
	},
	advantageA: {
		a: won('a'),
		b: continues('deuce'),
	},

	// Every other Game state appears here too
} as const satisfies GameTransitions
```

The implementation of `scorePoint` almost disappears:

```ts
export const scorePoint =
	(pointWinner: Player) =>
	(game: Game): GameResult =>
		transitions[game][pointWinner]
```

There is no scoring algorithm to simulate mentally. The transition table is the rulebook.

> With an algorithmic implementation, understanding the result often means executing the code in your head: track the intermediate values, follow their dependencies, and determine which result they produce.

To learn what happens when Player A wins at `thirtyForty`, find that row and read `a: continues('deuce')`. The code states the fact directly.

This distinction matters more than line count. The table may contain more text than an arithmetic algorithm, but it asks less of its reader. A rule change becomes a change to the affected mappings rather than another condition woven into a calculation. A new state becomes a new required table entry, and TypeScript identifies every total mapping that must account for it.

## Why `as const satisfies` matters

The end of the table carries two useful ideas:

```ts
as const satisfies GameTransitions
```

`as const` preserves literal values and makes the inferred table deeply readonly at compile time. `satisfies GameTransitions` asks TypeScript to verify that the table implements the complete mapping.

If we add a new member to `Game`, TypeScript reports that the table is missing a state. If we forget Player B's transition, TypeScript reports that too. The type and the data must evolve together.

This is stronger than simply allowing TypeScript to infer whatever object we happened to write. We are stating an architectural fact:

> This value is the total transition function for a tennis game.

## More verbosity, less hidden behavior

A tennis set can be modeled similarly. With a tiebreak beginning at 6–6, it has 38 reachable in-progress game-score states, including:

```ts
type SetGameScore =
	| 'loveLove'
	| 'oneLove'
	| 'loveOne'
	| 'oneOne'
	// ...
	| 'fiveFive'
	| 'sixFive'
	| 'fiveSix'
```

After a game is won, another table decides what happens to the set:

```ts
const transitions = {
	loveLove: {
		a: continues(game('oneLove')),
		b: continues(game('loveOne')),
	},
	fiveFive: {
		a: continues(game('sixFive')),
		b: continues(game('fiveSix')),
	},
	sixFive: {
		a: won('a', 7, 5),
		b: continues(tiebreak()),
	},
	fiveSix: {
		a: continues(tiebreak()),
		b: won('b', 5, 7),
	},

	// All other reachable set scores
} as const satisfies SetTransitions
```

This is undeniably verbose. Programmers are accustomed to treating fewer lines as an improvement, but 38 states are not a problem merely because writing them requires 38 entries. Most of that length is domain information. It tells us what happens at 5–5, 6–5, and 5–6 without making us reconstruct those rules from comparisons and arithmetic.

A compressed algorithm can be shorter while being harder to understand. Here, the source is long in the same way a clearly printed rulebook is long: every relevant case is visible, local, and easy to inspect. Code length is not the same thing as conceptual complexity.

The table also makes asymmetry easy to spot. A typo in one side of a transition looks suspicious when placed beside its mirror image.

## Keep state and transition results separate

A playable child state is not the same thing as the result of updating it. A game can continue or be won, but a won game is never stored as the current game of a set:

```ts
type GameResult =
	| { outcome: 'gameContinues'; game: Game }
	| { outcome: 'gameWon'; gameWinner: Player }
```

The set consumes that result immediately. It either stores the next playable `Game` or updates its own score. The same distinction applies between a set and a match:

```ts
type SetTransition =
	| { outcome: 'setContinues'; set: Set }
	| { outcome: 'setWon'; setWinner: Player; result: SetResult }
```

Consequently, `Set` means a set that can receive another point. `SetResult` means historical information about a completed set. We do not need types such as `ActiveSet` or `WonSet`, and an in-progress match cannot contain a won current set.

This follows the Elm Architecture at the application level as well. The complete `Match` is the model, messages describe events, and one pure update function produces the next model:

```text
Message → update → Match → view
```

Only a completed match remains as terminal application state. Completed games, tiebreaks, and sets flow upward as transition results for their parent to consume.

## State machines can contain state machines

The complete application is layered:

```text
Match → Set → Game or Tiebreak
```

A point first travels down to the active scoring unit. The resulting state then travels back up:

```text
point winner
    ↓
match delegates to set
    ↓
set delegates to game or tiebreak
    ↓
the lowest state transitions
    ↑
set incorporates the result
    ↑
match incorporates the result
```

Each module owns one level of the rules. `game.ts` does not know how many games win a set. `set.ts` does not know how many sets win a match. The modules communicate through explicit states and small public APIs.

This is functional architecture without requiring every expression to use a specialized combinator. Pure functions, immutable values, discriminated unions, exhaustive switches, pattern matching, and lookup tables can coexist.

## Stop enumerating when the domain stops being finite

The tiebreak shows the limit of this technique.

A tiebreak is won at seven points with a lead of two, but it has no maximum score. It may finish 7–0, 9–7, 14–12, or continue indefinitely.

The honest representation uses numbers:

```ts
export type TiebreakScore = Readonly<{
	a: number
	b: number
}>

export type Tiebreak = Readonly<{
	score: TiebreakScore
}>

export type TiebreakWin = Readonly<{
	winner: Player
	score: TiebreakScore
}>

export type TiebreakResult =
	| { outcome: 'tiebreakContinues'; tiebreak: Tiebreak }
	| { outcome: 'tiebreakWon'; result: TiebreakWin }
```

Its transition contains a small calculation:

```ts
const scorePoint =
	(pointWinner: Player) =>
	(tiebreak: Tiebreak): TiebreakResult => {
		const score = {
			...tiebreak.score,
			[pointWinner]: tiebreak.score[pointWinner] + 1,
		}

		const isTiebreakWon =
			score[pointWinner] >= 7 &&
			score[pointWinner] - score[opponent(pointWinner)] >= 2

		return isTiebreakWon
			? {
					outcome: 'tiebreakWon',
					result: { winner: pointWinner, score },
				}
			: { outcome: 'tiebreakContinues', tiebreak: { score } }
	}
```

This is not a retreat from the philosophy. It is the philosophy applied honestly. A finite lookup table is excellent for a finite domain. An unbounded numeric domain calls for a small pure calculation.

## Switches and pattern matching still belong

Lookup tables do not replace every conditional construct. Switches are excellent for dispatching over discriminated states:

```ts
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
```

Statements—and `switch` statements in particular—are sometimes considered anti-functional because they describe control flow and, unlike an Elm `case`, a JavaScript switch is not an expression. That is a useful pressure against sprawling procedural code, but it need not become a prohibition. An exhaustive switch inside a pure function is still deterministic, contains no mutation, and can make each variant of a TypeScript discriminated union immediately visible.

This application also uses `ts-pattern` where structural pattern matching makes nested data easier to describe. It provides expression-oriented matching and exhaustiveness checking, but it also introduces a dependency and requires readers to know that package's API. For a simple dispatch, a native switch may be clearer. It can even be easier to scan than a short ternary: named `case` branches expose the domain choices instead of making the reader parse a condition and decide which half of an expression applies.

Structural matching, switches, and ternaries each have a place. The goal is not to ban syntax or satisfy a definition of functional purity. The goal is to choose a representation that lets the rules read like facts instead of a sequence of instructions.

> Declarative code says what is true, while imperative code tells the machine how to arrive there. When the domain permits it, stating the facts directly leaves less code for the reader to execute mentally.

## A practical rule

When designing a transition, ask:

1. What are all the valid states?
2. Are the state and event spaces finite and reasonably small?
3. Would an explicit table be easier to inspect than an algorithm?

If the answer is yes, make the map.

If the table would be infinite, mechanically generated, or too large to understand, keep the state explicit and use the smallest honest calculation.

The lesson is not “replace functions with objects.” A lookup table is already a function in the mathematical sense. The lesson is that sometimes the clearest implementation of a function is simply to write down every value it maps to.
