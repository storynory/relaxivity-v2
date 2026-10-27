import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source = await fs.readFile('static/admin/mp3-metadata.js', 'utf8');

async function save(values: Record<string, unknown>, options: {
	header?: string | null; durationFails?: boolean; headFails?: boolean;
	settingsFail?: boolean;
	files?: Record<string, { header: string; seconds: number } | null>;
} = {}) {
	const requests: string[] = [];
	const media: string[] = [];
	let handler: (event: { entry: Map<string, unknown> }) => Promise<Map<string, unknown>>;
	class Audio {
		duration = 90.4;
		listeners = new Map<string, () => void>();
		addEventListener(name: string, callback: () => void) { this.listeners.set(name, callback); }
		set src(url: string) {
			media.push(url);
			const file = options.files?.[url];
			this.duration = file?.seconds ?? 90.4;
			queueMicrotask(() => this.listeners.get(options.durationFails || file === null ? 'error' : 'loadedmetadata')?.());
		}
		removeAttribute() {}
		load() {}
	}
	vm.runInNewContext(source, {
		Audio, URL, AbortSignal, setTimeout, clearTimeout,
		console: { warn() {}, info() {} },
		CMS: { registerEventListener(event: { handler: typeof handler }) { handler = event.handler; } },
		fetch: async (url: string, init: RequestInit) => {
			requests.push(url);
			if (url === '/admin/podcast-settings.json') {
				if (options.settingsFail) throw new Error('Settings unavailable');
				return Response.json({ audioBaseUrl: 'https://audio.relaxivity.app/' });
			}
			assert.equal(init.method, 'HEAD');
			assert.equal(init.cache, 'no-store', 'HEAD must bypass the Audio element’s non-CORS cached response');
			if (options.headFails) throw new Error('CORS');
			const file = options.files?.[url];
			if (file === null) return new Response(null, { status: 404 });
			const header = file?.header ?? options.header;
			return new Response(null, { headers: header == null ? {} : { 'Content-Length': header } });
		}
	});
	const data = new Map(Object.entries(values));
	const updated = await handler!({ entry: new Map<string, unknown>([['collection', 'podcasts'], ['data', data]]) });
	return { data: updated ?? data, requests, media };
}

test('the existing CMS hook detects R2 metadata without storing the resolved URL', async () => {
	const { data, requests, media } = await save({ audio: 'episodes/story.mp3' }, { header: '1234567' });
	assert.equal(data.get('audio'), 'episodes/story.mp3');
	assert.equal(data.get('duration'), '00:01:30');
	assert.equal(data.get('length'), 1234567);
	assert.deepEqual(requests, ['/admin/podcast-settings.json', 'https://audio.relaxivity.app/episodes/story.mp3']);
	assert.deepEqual(media, ['https://audio.relaxivity.app/episodes/story.mp3']);
});

test('CORS failures and unusable lengths leave size unset without losing detected duration', async () => {
	for (const options of [{ headFails: true }, { header: 'invalid' }, { header: '0' }, { header: null }]) {
		const { data } = await save({ audio: '/story.mp3' }, options);
		assert.equal(data.get('length'), undefined);
		assert.equal(data.get('duration'), '00:01:30');
	}
});

test('full URLs work without settings and existing byte counts remain editable', async () => {
	const { data, requests } = await save({ audio: 'https://old.example/story.mp3', length: 42 });
	assert.equal(data.get('length'), 42);
	assert.equal(data.get('duration'), '00:01:30');
	assert.deepEqual(requests, []);
});

test('duration failures preserve existing values while HEAD can still obtain the exact size', async () => {
	const { data, media } = await save({ audio: 'story.mp3', duration: 'manual value' }, { durationFails: true, header: '98765' });
	assert.equal(media.length, 2);
	assert.equal(data.get('duration'), 'manual value');
	assert.equal(data.get('length'), 98765);
	const failed = await save({ audio: 'story.mp3', duration: '02:00' }, { settingsFail: true });
	assert.equal(failed.data.get('duration'), '02:00');
	assert.deepEqual(failed.media, []);
});

test('full recording and sample metadata stay independent for relative paths and HTTPS URLs', async () => {
	for (const prefix of ['', 'https://audio.relaxivity.app/']) {
		const { data, requests, media } = await save({
			audio: `${prefix}episodes/story.mp3`, sampleAudio: `${prefix}samples/story.mp3`
		}, { files: {
			'https://audio.relaxivity.app/episodes/story.mp3': { header: '9000000', seconds: 3605 },
			'https://audio.relaxivity.app/samples/story.mp3': { header: '123456', seconds: 30 }
		} });
		assert.equal(data.get('length'), 9000000);
		assert.equal(data.get('duration'), '01:00:05');
		assert.equal(data.get('sampleLength'), 123456);
		assert.equal(data.get('sampleDuration'), '00:00:30');
		assert.equal(data.get('audio'), `${prefix}episodes/story.mp3`);
		assert.equal(data.get('sampleAudio'), `${prefix}samples/story.mp3`);
		assert.equal(requests.filter((url) => url === '/admin/podcast-settings.json').length, prefix ? 0 : 1);
		assert.equal(media.length, 2);
	}
});

test('a sample works without full audio and preserves existing full-recording metadata', async () => {
	const { data } = await save({ sampleAudio: '/samples/story.mp3', length: 999, duration: '01:00:00' }, { header: '123' });
	assert.equal(data.get('sampleLength'), 123);
	assert.equal(data.get('sampleDuration'), '00:01:30');
	assert.equal(data.get('length'), 999);
	assert.equal(data.get('duration'), '01:00:00');
});

test('valid metadata avoids all requests and preserves manual values for both recordings', async () => {
	const values = { audio: 'story.mp3', length: 999, duration: '01:00:00',
		sampleAudio: 'sample.mp3', sampleLength: 123, sampleDuration: '00:30' };
	const { data, requests, media } = await save(values);
	assert.deepEqual(Object.fromEntries(data), values);
	assert.deepEqual(requests, []);
	assert.deepEqual(media, []);
});

test('missing files preserve their own metadata without blocking the other recording', async () => {
	for (const missing of ['episodes/story.mp3', 'samples/story.mp3']) {
		const { data } = await save({ audio: 'episodes/story.mp3', sampleAudio: 'samples/story.mp3' }, {
			files: { [`https://audio.relaxivity.app/${missing}`]: null }, header: '123'
		});
		const failedPrefix = missing.startsWith('samples') ? 'sample' : '';
		assert.equal(data.get(failedPrefix ? 'sampleLength' : 'length'), undefined);
		assert.equal(data.get(failedPrefix ? 'sampleDuration' : 'duration'), undefined);
		assert.equal(data.get(failedPrefix ? 'length' : 'sampleLength'), 123);
		assert.equal(data.get(failedPrefix ? 'duration' : 'sampleDuration'), '00:01:30');
	}
});

test('unavailable settings for a relative path do not block an absolute sample URL', async () => {
	const { data } = await save({ audio: 'story.mp3', sampleAudio: 'https://other.example/sample.mp3' }, {
		settingsFail: true, header: '123'
	});
	assert.equal(data.get('length'), undefined);
	assert.equal(data.get('sampleLength'), 123);
	assert.equal(data.get('sampleDuration'), '00:01:30');
});
