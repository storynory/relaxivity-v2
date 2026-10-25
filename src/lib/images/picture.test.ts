import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pictureSources } from './picture';

test('provides WebP srcset and JPEG fallback from manifest', () => {
	const info = pictureSources('/uploads/cats/kitten.jpg', {
		'/uploads/cats/kitten.jpg': {
			width: 1920, height: 1080, sizes: [960, 320, 640], formats: ['webp'],
			fallback: '/optimized/cats/kitten.640.jpg'
		}
	});
	assert.deepEqual(info.sources, [{
		type: 'image/webp',
		srcset: '/optimized/cats/kitten.320.webp 320w, /optimized/cats/kitten.640.webp 640w, /optimized/cats/kitten.960.webp 960w'
	}]);
	assert.equal(info.fallback, '/optimized/cats/kitten.640.jpg');
	assert.equal(info.width, 1920);
});

test('AVIF is only advertised when manifest contains it', () => {
	const info = pictureSources('/uploads/example.png', {
		'/uploads/example.png': { width: 400, height: 200, sizes: [320], formats: ['webp', 'avif'] }
	});
	assert.deepEqual(info.sources.map((source) => source.type), ['image/avif', 'image/webp']);
});

test('unprocessed uploads and hand-optimised static files use their original URL', () => {
	assert.deepEqual(pictureSources('/photos/hero.avif', {}), { sources: [], fallback: '/photos/hero.avif' });
});
