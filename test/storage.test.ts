import test from 'node:test'
import assert from 'node:assert/strict'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import { initialMatch, type Match } from '../src/tennis/match.js'
import { load, save, type Storage } from '../src/storage.js'

const key = 'match'

const memoryStorage = (): Storage => {
	const values = new Map<string, string>()

	return {
		getItem: key => values.get(key) ?? null,
		setItem: (key, value) => void values.set(key, value),
	}
}

test('loads None when no match has been saved', () => {
	assert.deepEqual(load<Match>(key, memoryStorage()), E.right(O.none))
})

test('saves and loads a match', () => {
	const storage = memoryStorage()

	assert.deepEqual(save(key, initialMatch, storage), E.right(undefined))
	assert.deepEqual(load<Match>(key, storage), E.right(O.some(initialMatch)))
})

test('returns Left when loading or saving throws', () => {
	const storage: Storage = {
		getItem: () => '{',
		setItem: () => {
			throw new Error('Storage unavailable')
		},
	}

	assert.ok(E.isLeft(load<Match>(key, storage)))
	assert.ok(E.isLeft(save(key, initialMatch, storage)))
})
