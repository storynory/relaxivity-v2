import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isOriginalImage, plannedWidths, variantRelativePath } from './planning';

test('selects unique responsive widths without enlargement', () => {
	assert.deepEqual(plannedWidths(800, [960, 320, 640, 320]), [320, 640]);
	assert.deepEqual(plannedWidths(200, [320, 640, 960]), [200]);
	assert.deepEqual(plannedWidths(640, [320, 640, 960]), [320, 640]);
});

test('finds originals and does not re-process generated variants', () => {
	assert.equal(isOriginalImage('photos/kitten.JPG', ['.jpg', '.jpeg', '.png', '.webp']), true);
	assert.equal(isOriginalImage('photos/kitten.640.webp', ['.jpg', '.jpeg', '.png', '.webp']), false);
	assert.equal(isOriginalImage('notes.txt', ['.jpg']), false);
});

test('retains nested folders for derivative names', () => {
	assert.equal(variantRelativePath('cats/kitten.jpg', 640, 'webp'), 'cats/kitten.640.webp');
	assert.throws(() => variantRelativePath('../secret.jpg', 640, 'webp'), /relative image/);
});
