import { terms } from '#lib/server/taxonomy.ts';
export const load = async () => ({ terms: await terms('category') });
