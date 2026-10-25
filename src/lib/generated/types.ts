// Generated automatically from Sveltia collection YAML. Do not edit.

export type BlocksContent = {
	"title": string;
	"type": "selected" | "latest" | "featured" | "hero" | "panel";
	"heading"?: string;
	"introduction"?: string;
	"image"?: string;
	"imageAlt"?: string;
	"imagePosition"?: "left" | "right";
	"buttonText"?: string;
	"buttonUrl"?: string;
	"collection"?: "posts" | "podcasts";
	"category"?: string;
	"tags"?: string[];
	"tagMatch"?: "any" | "all";
	"limit"?: number;
	"items"?: unknown[];
};

export type CategoriesContent = {
	"title": string;
	"description"?: string;
	"image"?: string;
	"parent"?: string;
	"seo"?: {
		"title"?: string;
		"description"?: string;
	};
};

export type ColourSchemesContent = {
	"title": string;
	"prime": string;
	"accent": string;
	"second": string;
	"gray": string;
	"text": string;
};

export type NavigationContent = {
	"title": string;
	"items"?: {
		"label": string;
		"url"?: string;
		"newTab": boolean;
		"children"?: {
			"label": string;
			"url": string;
			"newTab": boolean;
		}[];
	}[];
};

export type PagesContent = {
	"title": string;
	"excerpt"?: string;
	"seo"?: {
		"title"?: string;
		"description"?: string;
	};
	"layout"?: "standard" | "wide";
	"body"?: string;
	"blocks"?: string[];
};

export type PeopleContent = {
	"name": string;
	"roles"?: ("Author" | "Narrator" | "Presenter" | "Producer" | "Editor" | "Illustrator" | "Composer" | "Other")[];
	"bio"?: string;
	"photo"?: string;
	"website"?: string;
};

export type PodcastsContent = {
	"title": string;
	"draft": boolean;
	"body"?: string;
	"excerpt"?: string;
	"description"?: string;
	"date": string;
	"episodeNumber"?: number;
	"seasonNumber"?: number;
	"audio"?: string;
	"bitrate"?: number;
	"length"?: number;
	"duration"?: string;
	"author"?: string;
	"narrator"?: string;
	"presenter"?: string;
	"producer"?: string;
	"featuredImage"?: string;
	"featuredImageAlt"?: string;
	"category"?: string;
	"tags"?: string[];
	"showOnHome"?: boolean;
	"featured"?: boolean;
	"seo"?: {
		"title"?: string;
		"description"?: string;
	};
};

export type PostsContent = {
	"title": string;
	"draft": boolean;
	"body": string;
	"excerpt"?: string;
	"date": string;
	"author"?: string;
	"category"?: string;
	"tags"?: string[];
	"showOnHome"?: boolean;
	"featured"?: boolean;
	"featuredImage"?: string;
	"featuredImageAlt"?: string;
	"seo"?: {
		"title"?: string;
		"description"?: string;
	};
};

export type SettingsGeneralContent = {
	"siteName": string;
	"tagline"?: string;
	"siteUrl"?: string;
	"description"?: string;
	"siteLogo"?: string;
	"favicon"?: string;
	"defaultImage"?: string;
	"language": string;
	"homePage": string;
	"activeScheme"?: string;
	"activeTypography"?: string;
	"social"?: {
		"facebook"?: string;
		"instagram"?: string;
		"youtube"?: string;
		"linkedin"?: string;
		"x"?: string;
	};
	"footer"?: {
		"copyright"?: string;
		"description"?: string;
	};
	"rss"?: {
		"enabled": boolean;
		"limit": number;
		"content": "summary" | "full";
	};
	"sitemap"?: {
		"enabled": boolean;
	};
	"podcastFeed"?: {
		"enabled": boolean;
		"limit": number;
		"title"?: string;
		"description"?: string;
		"author"?: string;
		"image"?: string;
		"ownerName"?: string;
		"ownerEmail"?: string;
		"type"?: "episodic" | "serial";
		"category"?: "Arts" | "Business" | "Comedy" | "Education" | "Fiction" | "Government" | "History" | "Health & Fitness" | "Kids & Family" | "Leisure" | "Music" | "News" | "Religion & Spirituality" | "Science" | "Society & Culture" | "Sports" | "Technology" | "True Crime" | "TV & Film";
		"explicit": boolean;
	};
};

export type TagsContent = {
	"title": string;
	"description"?: string;
	"image"?: string;
	"seo"?: {
		"title"?: string;
		"description"?: string;
	};
};

export type TypographyContent = {
	"title": string;
	"bodyFont": string;
	"headingFont": string;
	"fontSize": number;
	"fontScale": number;
	"lineHeight": number;
};

export type ContentByCollection = {
	"blocks": BlocksContent;
	"categories": CategoriesContent;
	"colour-schemes": ColourSchemesContent;
	"navigation": NavigationContent;
	"pages": PagesContent;
	"people": PeopleContent;
	"podcasts": PodcastsContent;
	"posts": PostsContent;
	"settings": {
		"general": SettingsGeneralContent;
	};
	"tags": TagsContent;
	"typography": TypographyContent;
};
