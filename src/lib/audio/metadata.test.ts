import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source = await fs.readFile('static/admin/mp3-metadata.js', 'utf8');

async function save(values: Record<string, unknown>, options: {
	header?: string | null; durationFails?: boolean; headFails?: boolean;
	settingsFail?: boolean;
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
			queueMicrotask(() => this.listeners.get(options.durationFails ? 'error' : 'loadedmetadata')?.());
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
			if (options.headFails) throw new Error('CORS');
			return new Response(null, { headers: options.header == null ? {} : { 'Content-Length': options.header } });
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

test('duration failures preserve manual duration while HEAD can still obtain the exact size', async () => {
	const { data, media } = await save({ audio: 'story.mp3', duration: '02:00' }, { durationFails: true, header: '98765' });
	assert.equal(media.length, 2);
	assert.equal(data.get('duration'), '02:00');
	assert.equal(data.get('length'), 98765);
	const failed = await save({ audio: 'story.mp3', duration: '02:00' }, { settingsFail: true });
	assert.equal(failed.data.get('duration'), '02:00');
	assert.deepEqual(failed.media, []);
});
