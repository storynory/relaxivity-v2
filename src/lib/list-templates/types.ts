/** Collection listings receive intact published records, not a blog-specific projection. */
export type ListingData = {
	collection: string;
	items: Record<string, unknown>[];
	listTemplate: string;
};
