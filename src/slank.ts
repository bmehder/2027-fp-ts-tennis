type Signal<Value> = {
	value: Value
}

let subscriber: (() => void) | null = null

export const explicit = <Value>(value: Value): Signal<Value> => {
	const subscriptions = new Set<() => void>()

	return {
		get value() {
			if (subscriber) subscriptions.add(subscriber)
			return value
		},
		set value(newValue) {
			value = newValue
			subscriptions.forEach(fn => fn())
		},
	}
}

export const implicit = <Value>(fn: () => Value): Signal<Value> => {
	const derived = explicit<Value>(undefined as Value)

	fx(() => {
		derived.value = fn()
	})

	return derived
}

export const fx = (fn: () => void) => {
	subscriber = fn
	fn()
	subscriber = null
}
