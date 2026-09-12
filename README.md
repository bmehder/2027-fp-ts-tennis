# fp-ts Tennis

This app models a tennis match as data and describes how that data changes when a player wins a point.

At the center is one value representing the entire match:

```text
Match
└── current Set
    └── current Game or Tiebreak
```

When a player wins a point, that event travels down through the model:

```text
Player wins point
→ Match passes it to Set
→ Set passes it to Game or Tiebreak
```

The result travels back up:

```text
Game continues
→ Set stores the updated Game

Game ends
→ Set updates its game score

Set ends
→ Match stores the result and starts another Set

Match ends
→ Match records the winner
```

Nothing modifies the existing model. Each operation receives the current value and returns a new model representing what is true afterward.

## The domain model

The tennis files define the possible states and rules:

- `Game` represents a playable tennis game.
- `Tiebreak` represents a playable tiebreak.
- `Set` contains either a game or a tiebreak currently being played.
- `Match` contains the current set and the results of completed sets, or represents a completed match.
- `Player` identifies Player A or Player B.

The types exclude states that should not exist. For example, a set cannot contain a completed game as its current game. Finishing a game is an outcome passed back to the set, which immediately decides what happens next.

## The transitions

Each scoring function answers the same general question:

```text
current state + point winner → result
```

For a tennis game and the ordinary game scores within a set, the possible states are finite. The app writes their transitions down in lookup tables:

```text
30–40 + Player A wins → deuce
30–40 + Player B wins → game won by Player B
```

These tables act as rulebooks. Instead of executing an algorithm mentally, a reader can inspect the entry for a particular state and event.

A tiebreak can continue indefinitely, so it cannot be completely enumerated. That module uses arithmetic: add a point and determine whether a player has at least seven points with a lead of two.

The representation is chosen to fit the domain rather than forcing every part of tennis into one programming technique.

## The application loop

The browser-facing code follows a small Elm-like architecture:

```text
Message → update → Model → View
```

A button click creates a message saying that a player won a point. The update function applies that message to the current match and returns the next match. The view is then derived from that model.

The view functions are projections:

```text
Match → MatchView
Set → SetScore
Game → DisplayScore
```

They do not change the match. They convert domain data into representations suitable for displaying on the page.

A small reactive system notices when the match value changes and updates the DOM. Reactivity is therefore outside the tennis rules; the domain modules do not know that a browser exists.

At the highest level, the program is this:

> It defines every meaningful tennis state, defines how a point transforms one state into the next, and derives the screen from the resulting match.

The architectural principle underneath it is:

> Keep the valid state explicit, keep transitions pure, pass completion outcomes to the parent that owns them, and derive presentation data only at the edge of the application.

For a deeper look at the table-driven modeling technique, read [When the Rules Are Finite, Write Them Down](./enumerated-state-machines.md).

## Run the app

```sh
npm install
npm run dev
```

Run the type checker and tests with:

```sh
npm run check
npm test
```
