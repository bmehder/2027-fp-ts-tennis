# When the Rules Are Finite, Write Them Down

Here is the argument of this article:

> When a domain has a small, finite set of states and events, the clearest implementation is often a table containing every valid transition.

Not always. Not for every function, and not for every state machine. But when the domain is finite enough to fit comfortably in one file, writing down the answers can be clearer than writing an algorithm that calculates them.

A tennis game is a good example. Its rules are familiar, slightly irregular, and small enough to enumerate. That combination lets us compare two ways of representing the same behavior.

## The problem is not mutation

Suppose we represent a tennis game with two point counts. Scoring a point might mean incrementing one count, checking whether that player has at least four points, and checking whether the lead is at least two.

That can be implemented as a pure function. It does not require mutation, classes, or side effects. Those are not the problem.

The problem is that the tennis rules are hidden inside a procedure. To answer a concrete question—what happens when Player A wins a point at 30–40?—a reader must understand what the numbers represent, update the right number, follow the comparisons, and translate the result back into tennis language.

> Understanding an algorithm often means executing it in your head: track the intermediate values, follow their dependencies, evaluate the conditions, and determine which result they produce.

That work may be easy for a small function. It becomes less easy as exceptions and new rules accumulate. The source can remain compact while the behavior becomes increasingly implicit.

But a tennis game does not have an arbitrary collection of scores. It has a short list of meaningful situations, and each situation has exactly two possible events: Player A wins the next point or Player B does.

We can write those facts down directly.

## Start with the vocabulary of the game

These are the playable states in an advantage-scoring tennis game:

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

This is more verbose than two numbers. It is also more informative.

A `Game` cannot be 50–15. Both players cannot have advantage. A score cannot be negative. We do not need guards for those cases because they are not members of the type. The model [makes invalid states unrepresentable](https://youtu.be/IcgmSRJHu_8?si=gu3SwM4HSEbitjqr).

Validation may still be necessary where unknown data enters a program. Inside the typed domain, however, every `Game` is already known to be a real tennis state. Functions can concentrate on the rules instead of repeatedly defending themselves from values the program should never have created.

The names also remove a layer of interpretation. `thirtyForty` says what the state means. The reader does not need to remember whether `{ a: 2, b: 3 }` represents total points won, displayed points, or some normalized score used to make an algorithm convenient.

## A function is a mapping

Scoring a point is a function with two inputs:

```text
current game × point winner → result
```

`Game` is finite. `Player` is finite:

```ts
export type Player = 'a' | 'b'
```

Because every possible input is known, we can represent the function as a `Record`:

```ts
export type GameResult =
	| { outcome: 'gameContinues'; game: Game }
	| { outcome: 'gameWon'; gameWinner: Player }

type GameTransitions = Readonly<
	Record<Game, Readonly<Record<Player, GameResult>>>
>
```

The outer record contains an entry for every game state. The inner record contains an answer for each possible point winner.

A few small constructors keep the table readable:

```ts
const continues = (game: Game): GameResult => ({
	outcome: 'gameContinues',
	game,
})

const won = (gameWinner: Player): GameResult => ({
	outcome: 'gameWon',
	gameWinner,
})
```

Now the rules can be expressed as data:

```ts
const transitions = {
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
	advantageB: {
		a: continues('deuce'),
		b: won('b'),
	},

	// The other playable states follow the same shape
} as const satisfies GameTransitions
```

Read one row as a statement of fact:

> At 30–40, a point won by A continues the game at deuce, while a point won by B wins the game for B.

Nothing has to be incremented or compared before that fact becomes visible. The table is not a description of how to derive the tennis rule. It is the rule.

This is the practical difference between the two representations. Imperative code tells the machine which steps produce an answer. Declarative code states what the answer is. A pure algorithm can still be procedural in this sense; purity and declarative modeling are separate concerns.

## The implementation almost disappears

Once the table exists, `scorePoint` is only a lookup:

```ts
export const scorePoint =
	(pointWinner: Player) =>
	(game: Game): GameResult =>
		transitions[game][pointWinner]
```

This function contains no tennis logic because the table contains all of it.

That makes concrete questions local. To find what happens after Player A wins at `thirtyForty`, look at one property in one row. There is no execution path to trace and no temporary state to retain while reading.

It also changes how modifications feel. Adding a state means adding its transitions and updating any other total maps over `Game`. Changing one rule means changing the corresponding entry. The programmer edits facts instead of carefully inserting another condition into an existing calculation.

## Let TypeScript prove the table is complete

The annotation at the end of the table matters:

```ts
as const satisfies GameTransitions
```

`as const` preserves the literal values in the object. `satisfies GameTransitions` checks that the object is a complete implementation of the mapping without replacing its useful inferred type.

If a new member is added to `Game`, TypeScript reports that the table lacks a row. If one row omits Player B, TypeScript reports that the inner mapping is incomplete. If a transition points to a string that is not a `Game`, TypeScript rejects it.

The compiler is checking a stronger claim than “this object looks reasonable”:

> For every valid game and every possible point winner, this table contains a valid result.

That is what makes the representation trustworthy. An explicit table without a completeness check could quietly omit part of the rulebook.

## Outcomes should not become playable states

Notice that `Game` does not contain a `won` state. Winning is a possible result of scoring a point, but a completed game cannot receive another point.

```ts
export type GameResult =
	| { outcome: 'gameContinues'; game: Game }
	| { outcome: 'gameWon'; gameWinner: Player }
```

This distinction became important as the application grew. A set owns the current playable game. When that game produces `gameWon`, the set consumes the outcome immediately: it updates its game score, starts a new game, begins a tiebreak, or reports that the set has been won.

The same relationship exists one level higher. A match owns the current playable set and consumes a `setWon` outcome. Completed set scores become match history; a completed `Set` does not remain in the position reserved for the current set.

The resulting hierarchy is simple:

```text
Match → Set → Game or Tiebreak
```

Each model contains only states that make sense at its level. Each transition reports an outcome to the parent that knows what the outcome means. This avoids awkward extracted types and defensive checks for combinations that should not exist.

This is the same principle as the transition table: represent the domain facts directly. “A set contains a game that can still be played” is a better model than “a set may contain any game state, but callers must check whether it has already ended.”

## Verbosity is not complexity

The same table-driven approach is used for ordinary game scores within a set. There are 38 reachable in-progress set scores before accounting for the tiebreak itself.

Writing 38 entries can feel wrong because programmers are trained to remove repetition and minimize code. But those entries are not 38 copies of an algorithm. They are 38 pieces of domain information.

The relevant question is not how many lines the table occupies. It is how difficult each line is to understand, verify, and change. A long table of independent facts can have less conceptual complexity than a short algorithm whose conditions interact.

There is a limit, of course. A thousand nearly identical entries would be difficult to navigate and maintain. Enumeration is useful only while the complete map remains easier for a person to inspect than the procedure that would generate it.

## Stop when the domain stops being finite

A tennis tiebreak establishes that boundary clearly. It is won at seven points with a lead of two, but it has no maximum score. A tiebreak may finish 7–0, 9–7, or 14–12, and it can continue indefinitely.

Enumerating every tiebreak score would require an infinite table. The honest model therefore uses numbers and a small calculation:

```ts
export type TiebreakScore = Readonly<{
	a: number
	b: number
}>

const hasWon =
	(pointWinner: Player) =>
	(score: TiebreakScore): boolean =>
		score[pointWinner] >= 7 &&
		score[pointWinner] - score[opponent(pointWinner)] >= 2
```

Using an algorithm here does not contradict the argument. It applies the boundary in the argument. Tables are compelling when the domain is finite, reasonably small, and meaningfully enumerated. An unbounded numeric domain calls for a calculation.

## Write down the rules when you can

This is not a proposal to replace functions with objects. A lookup table is a function in the mathematical sense: it maps every input to exactly one output. It is simply a different implementation of that function.

Nor is it a demand to eliminate `switch`, pattern matching, arithmetic, or ordinary control flow. This application uses all of them where they express the model clearly. The point is narrower:

> Do not automatically encode a finite rulebook as an algorithm merely because the algorithm uses fewer lines.

First ask what the valid states are. Ask whether the possible events are finite. Ask whether the complete mapping would fit in a form that a reader could scan and verify.

If it would, consider making the map.

The resulting program may be longer, but its behavior will be sitting in plain sight.
