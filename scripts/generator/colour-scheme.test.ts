import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readDoc } from '../../src/lib/content/read.ts';
import { getOne } from '../../src/lib/server/content.ts';

test('active colour scheme points to an existing CMS record', async () => {
	const settings = (await readDoc('settings', 'general')).data;
	assert.equal(typeof settings.activeScheme, 'string');
	const scheme = await getOne('colour-schemes', settings.activeScheme as string);
	assert.ok(scheme, 'selected colour scheme must exist');
	assert.match(scheme.accent, /^#[\da-fA-F]{3}([\da-fA-F]{3})?$/);
});
