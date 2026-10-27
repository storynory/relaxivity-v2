import assert from 'node:assert/strict';
import { test } from 'node:test';
import { latestFreeEpisodes, publicAudio, subscriptionUrl } from './availability.ts';

const now = Date.parse('2026-10-01T12:00:00Z');
const base = 'https://audio.example/';
const episode = (slug: string, extra = {}) => ({
	slug, date: '2026-01-01', audio: `full/${slug}.mp3`, duration: '01:00:00', length: 999999,
	sampleAudio: `samples/${slug}.mp3`, sampleDuration: '00:01:30', sampleLength: 12345, permanentlyFree: false, ...extra
});

test('fewer than twelve episodes are all free; drafts, future and invalid dates never count', () => {
	const episodes = [episode('a'), episode('b'), episode('draft', { draft: true }),
		episode('future', { date: '2026-10-01T12:00:01Z' }), episode('invalid', { date: undefined })];
	assert.deepEqual(latestFreeEpisodes(episodes, now).map(({ slug }) => slug), ['a', 'b']);
	assert.equal(latestFreeEpisodes([episode('scheduled', { date: new Date(now).toISOString() })], now).length, 1);
	for (const item of episodes.slice(2)) {
		assert.equal(publicAudio(item, [item.slug], base, now).playbackType, 'unavailable');
	}
});

test('rolling twelve sort by date then slug independently of input order and permanent flags', () => {
	const episodes = Array.from({ length: 14 }, (_, i) => episode(String(i).padStart(2, '0')));
	episodes[13].permanentlyFree = true;
	const slugs = latestFreeEpisodes(episodes.slice().reverse(), now).map(({ slug }) => slug);
	assert.deepEqual(slugs, episodes.slice(0, 12).map(({ slug }) => slug));
	assert.equal(latestFreeEpisodes([episode('older'), episode('newest', { date: '2026-09-01' })], now)[0].slug, 'newest');
	assert.deepEqual(publicAudio(episodes[0], slugs, base, now), {
		isInFreeFeed: true, isPermanentlyFree: false, canPlayFullAudio: true, playbackType: 'full',
		src: `${base}full/00.mp3`, duration: '01:00:00', length: 999999
	});
	assert.deepEqual(publicAudio(episodes[12], slugs, base, now), {
		isInFreeFeed: false, isPermanentlyFree: false, canPlayFullAudio: false, playbackType: 'sample',
		src: `${base}samples/12.mp3`, duration: '00:01:30', length: 12345
	});
	const permanent = publicAudio(episodes[13], slugs, base, now);
	assert.equal(permanent.isInFreeFeed, false);
	assert.equal(permanent.isPermanentlyFree, true);
	assert.equal(permanent.playbackType, 'full');
	assert.equal(permanent.src, `${base}full/13.mp3`);
	assert.equal(permanent.duration, '01:00:00');
	assert.equal(permanent.length, 999999);
});

test('missing samples never fall back to full audio or full metadata', () => {
	const selection = publicAudio(episode('archive', { sampleAudio: undefined }), [], base, now);
	assert.equal(selection.src, '');
	assert.equal(selection.playbackType, 'unavailable');
	assert.equal(selection.duration, '');
	assert.equal(selection.length, undefined);
	assert.equal(publicAudio(episode('archive', { sampleDuration: undefined, sampleLength: undefined }), [], base, now).duration, '');
});

test('subscription links require a configured HTTP(S) URL', () => {
	for (const value of [undefined, '', 'invalid', '/subscribe', 'javascript:alert(1)', 'https://user:password@example.com']) {
		assert.equal(subscriptionUrl(value), '');
	}
	assert.equal(subscriptionUrl('https://relaxivity.supercast.com'), 'https://relaxivity.supercast.com/');
});
