import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { get } from 'svelte/store';
import { createFavourites, favouritesStorageKey } from './favourites.ts';

const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
let values: Map<string, string>;
beforeEach(() => {
	values = new Map();
	Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
		getItem: (key: string) => values.get(key) ?? null,
		setItem: (key: string, value: string) => values.set(key, value)
	} });
});
after(() => {
	if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
	else Reflect.deleteProperty(globalThis, 'localStorage');
});

test('favourites load only after mounting, persist toggles and retain saved order', () => {
	const favourites = createFavourites();
	assert.equal(get(favourites).ready, false);
	favourites.load();
	favourites.toggle('one'); favourites.toggle('two'); favourites.toggle('three');
	favourites.move('three', -1);
	assert.deepEqual(get(favourites).slugs, ['one', 'three', 'two']);
	favourites.move('one', -1);
	favourites.move('two', 1);
	favourites.toggle('three');
	const reloaded = createFavourites();
	reloaded.load();
	assert.deepEqual(get(reloaded).slugs, ['one', 'two']);
	assert.equal(get(reloaded).ready, true);
});

test('stored data is validated and deduplicated; malformed JSON does not break rendering', () => {
	values.set(favouritesStorageKey, JSON.stringify(['one', null, 'one', 2, '', 'two']));
	const favourites = createFavourites();
	favourites.load();
	assert.deepEqual(get(favourites).slugs, ['one', 'two']);
	for (const raw of ['{broken', '{}', 'null']) {
		values.set(favouritesStorageKey, raw);
		favourites.load();
		assert.deepEqual(get(favourites).slugs, []);
	}
});

test('unavailable storage keeps favourites in memory and reports the limitation', () => {
	Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Blocked'); } });
	const favourites = createFavourites();
	favourites.load(); favourites.toggle('one');
	assert.deepEqual(get(favourites).slugs, ['one']);
	assert.equal(get(favourites).persistent, false);
	assert.equal(get(favourites).ready, true);
});

test('write failures retain edits and another-tab updates can be reloaded', () => {
	const favourites = createFavourites(); favourites.load();
	localStorage.setItem = () => { throw new Error('Quota exceeded'); };
	favourites.toggle('one');
	assert.deepEqual(get(favourites).slugs, ['one']);
	assert.equal(get(favourites).persistent, false);
	values.set(favouritesStorageKey, '["two"]');
	favourites.load();
	assert.deepEqual(get(favourites).slugs, ['two']);
});
