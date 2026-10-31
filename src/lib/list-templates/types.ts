/** Collection listings receive intact published records, not a blog-specific projection. */
export type ListingData = {
	collection: string;
	items: Record<string, unknown>[];
	listTemplate: string;
	title: string;
	description: string;
	seo: { title: string; description: string; image: string };
	pagination?: {
		page: number;
		totalPages: number;
		total: number;
		pages: { number: number; href: string }[];
	};
};
