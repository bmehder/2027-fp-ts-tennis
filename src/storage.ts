import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import { pipe } from 'fp-ts/function'

export type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>

export const load = <Value>(
	key: string,
	storage: Storage = localStorage,
): E.Either<Error, O.Option<Value>> =>
	E.tryCatch(
		() =>
			pipe(
				storage.getItem(key),
				O.fromNullable,
				O.map(serializedMatch => JSON.parse(serializedMatch)),
			),
		E.toError,
	)

export const save = <Value>(
	key: string,
	value: Value,
	storage: Storage = localStorage,
): E.Either<Error, void> =>
	E.tryCatch(() => storage.setItem(key, JSON.stringify(value)), E.toError)
