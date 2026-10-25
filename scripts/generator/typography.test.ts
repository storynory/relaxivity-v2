import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readDoc } from '../../src/lib/content/read.ts';
import { getOne } from '../../src/lib/server/content.ts';

test('active typography preset points to an existing CMS record', async () => {
	const settings = (await readDoc('settings', 'general')).data;
	assert.equal(typeof settings.activeTypography, 'string');
	const preset = await getOne('typography', settings.activeTypography as string);
	assert.ok(preset, 'selected typography preset must exist');
	assert.equal(typeof preset.bodyFont, 'string');
	assert.equal(typeof preset.headingFont, 'string');
	assert.ok(Number(preset.fontSize) >= 12 && Number(preset.fontSize) <= 28);
});
