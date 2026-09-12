# fp-ts Tennis

A small tennis-game scorer for exploring fp-ts with TypeScript and Slank.

```sh
npm install
npm run dev
```

Checks and tests:

```sh
npm run check
npm test
```

`src/tennis/game.ts` contains the pure scoring model. `Game` is a discriminated union,
its state transitions use exhaustive switches, and a possible winner is
represented as `Option<Player>`.

`src/types.ts` contains the domain types and the type guard used at the DOM boundary.
# 2027-fp-ts-tennis
