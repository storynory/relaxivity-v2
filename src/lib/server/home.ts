import { getSettings } from '#lib/server/content.ts';

/** Homepage is an ordinary Page selected by its slug in Site Settings. */
export async function homePageSlug(): Promise<string> {
	const settings = await getSettings('settings', 'general');
	return typeof settings.homePage === 'string' && settings.homePage ? settings.homePage : 'home';
}
