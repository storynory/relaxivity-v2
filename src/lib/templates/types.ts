/** Every public collection is passed as an intact record.
 * Individual templates interpret the fields required by their own content type.
 */
import type { RenderedBlock } from '#lib/server/blocks.ts';

export type DetailTemplateData = {
	title: string;
	collection: string;
	template: string;
	item: Record<string, unknown>;
	blocks?: RenderedBlock[];
};
