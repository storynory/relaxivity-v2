import assert from 'node:assert/strict';
import { test } from 'node:test';
import { orderStories } from './story-order.ts';

test('date ordering handles Date objects, quoted dates, missing dates and equal dates consistently', () => {
	const stories = [
		{ slug: 'missing', date: undefined },
		{ slug: 'old', date: new Date('2025-01-01') },
		{ slug: 'new-b', date: '2026-01-01' },
		{ slug: 'invalid', date: 'invalid' },
		{ slug: 'new-a', date: '2026-01-01' }
	];
	assert.deepEqual(orderStories(stories, 'newest').map((item) => item.slug), ['new-a', 'new-b', 'old', 'invalid', 'missing']);
	assert.deepEqual(orderStories(stories, 'oldest').map((item) => item.slug), ['old', 'new-a', 'new-b', 'invalid', 'missing']);
	assert.equal(stories[0].slug, 'missing');
});

test('title ordering is case insensitive and natural; manual order is preserved without mutating the source', () => {
	const stories = [{ slug: 'two', title: 'Story 2' }, { slug: 'ten', title: 'story 10' }, { slug: 'a', title: 'Alpha' }];
	assert.deepEqual(orderStories(stories, 'title-asc').map((item) => item.slug), ['a', 'two', 'ten']);
	assert.deepEqual(orderStories(stories, 'title-desc').map((item) => item.slug), ['ten', 'two', 'a']);
	assert.deepEqual(orderStories(stories, 'manual'), stories);
	assert.notEqual(orderStories(stories, 'manual'), stories);
});
