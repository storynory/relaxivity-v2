import { collections } from '#lib/generated/collections.ts';
import { publicCollections } from '#lib/server/public-routes.ts';
import { getOne } from '#lib/server/content.ts';
import { readDoc } from '#lib/content/read.ts';
import type { LayoutServerLoad } from './$types';

const defaults = {
	prime: '#e3d2b7',
	accent: '#00634e',
	second: '#f4e8d7',
	gray: '#f8f9fa',
	text: '#333333'
};

const defaultTypography = {
	bodyFont: "system-ui, -apple-system, 'Segoe UI', sans-serif",
	headingFont: "system-ui, -apple-system, 'Segoe UI', sans-serif",
	fontSize: 17,
	fontScale: 1.2,
	lineHeight: 1.6
};

const fontStack = (value: unknown, fallback: string) =>
	typeof value === 'string' && value.trim() && /^[\w\s,'".-]+$/.test(value)
		? value.trim()
		: fallback;

const boundedNumber = (value: unknown, fallback: number, min: number, max: number) =>
	typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
		? value
		: fallback;

// Sveltia's colour widget supplies hex colours.
const colour = (value: unknown, fallback: string) =>
	typeof value === 'string' && /^#[\da-fA-F]{3}([\da-fA-F]{3})?$/.test(value)
		? value
		: fallback;

export const load: LayoutServerLoad = async () => {
	// Read the configured slug directly, then load that colour scheme.
	const settings = (await readDoc('settings', 'general')).data;
	const slug = typeof settings.activeScheme === 'string' && settings.activeScheme
		? settings.activeScheme : 'default';
	const scheme = await getOne('colour-schemes', slug);
	if (!scheme) throw new Error(`Colour scheme "${slug}" was not found in content/colour-schemes`);

	const typographySlug = typeof settings.activeTypography === 'string' && settings.activeTypography
		? settings.activeTypography : 'default';
	const preset = await getOne('typography', typographySlug);
	if (!preset) throw new Error(`Typography preset "${typographySlug}" was not found in content/typography`);

	return {
		typography: {
			bodyFont: fontStack(preset.bodyFont, defaultTypography.bodyFont),
			headingFont: fontStack(preset.headingFont, defaultTypography.headingFont),
			fontSize: boundedNumber(preset.fontSize, defaultTypography.fontSize, 12, 28),
			fontScale: boundedNumber(preset.fontScale, defaultTypography.fontScale, 1, 1.6),
			lineHeight: boundedNumber(preset.lineHeight, defaultTypography.lineHeight, 1, 2.2)
		},
		siteUrl: typeof settings.siteUrl === 'string' ? settings.siteUrl : '',
		siteDescription: typeof settings.description === 'string' ? settings.description : '',
		defaultImage: typeof settings.defaultImage === 'string' ? settings.defaultImage : '',
		siteName: typeof settings.siteName === 'string' ? settings.siteName : '',
		siteLogo: typeof settings.siteLogo === 'string' ? settings.siteLogo : '',
		navigation: (await getOne('navigation', 'main-menu'))?.items ?? [],
		feeds: publicCollections().flatMap((collection) => {
			const type = String(collections[collection].rss);
			if (type !== 'standard' && type !== 'podcast') return [];
			const options = type === 'podcast' ? settings.podcastFeed : settings.rss;
			if ((options as { enabled?: boolean } | null)?.enabled === false) return [];
			return [{ href: `/${collection}/feed.xml`, title: `${typeof settings.siteName === 'string' ? settings.siteName : 'Website'} ${collection} RSS` }];
		}),
		colours: {
			prime: colour(scheme.prime, defaults.prime),
			accent: colour(scheme.accent, defaults.accent),
			second: colour(scheme.second, defaults.second),
			gray: colour(scheme.gray, defaults.gray),
			text: colour(scheme.text, defaults.text)
		}
	};
};
