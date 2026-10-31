import type { CmsCollection, CmsField } from './config';

function formatOf(format?: string) {
	switch (format) {
		case 'json':
			return 'json';
		case 'yaml':
		case 'yml':
			return 'yaml';
		default:
			return 'markdown';
	}
}

// Find relationship fields in a CMS collection.
function findRelations(fields: CmsField[] = []) {
	const relations: Record<
		string,
		{
			collection: string;
			multiple: boolean;
			valueField: string;
		}
	> = {};

	for (const field of fields) {
		if (field.widget === 'relation' && field.collection) {
			relations[field.name] = {
				collection: field.collection,
				multiple: field.multiple ?? false,
				valueField: field.value_field ?? '{{slug}}'
			};
		}
	}

	return relations;
}

export function generateCollections(input: CmsCollection[], templateNames: string[] = ['default']) {
	const collections: Record<string, unknown> = {};

	for (const item of input) {
		const fields = (
			item as CmsCollection & {
				fields?: CmsField[];
			}
		).fields;

		if (item.folder) {
			const label = item.label?.trim() || item.name;
			const title = item.archive?.title?.trim() || label;
			const introduction = item.archive?.introduction?.trim() || '';
			collections[item.name] = {
				kind: 'folder',
				label,
				labelSingular: item.label_singular?.trim() || label,
				archive: {
					title,
					introduction,
					seo: {
						title: item.archive?.seo?.title?.trim() || title,
						description: item.archive?.seo?.description?.trim() || introduction,
						image: item.archive?.seo?.image?.trim() || ''
					}
				},
				publicRoute: item.public_route === true,
				rss: item.rss ?? false,
				template: item.template ?? 'default',
				listTemplate: item.list_template ?? 'default',
				templateOverrides: (fields?.find((field) => field.name === 'template' && field.widget === 'select')?.options ?? [])
					.map((option) => typeof option === 'string' ? option : option.value),
				folder: item.folder,
				extension: item.extension ?? 'md',
				format: formatOf(item.format),
				relations: findRelations(fields)
			};
		} else if (item.files) {
			collections[item.name] = {
				kind: 'files',
				files: item.files.map((file) => ({
					name: file.name,
					file: file.file,
					format: formatOf(file.format ?? item.format),
					relations: findRelations(
						(
							file as typeof file & {
								fields?: CmsField[];
							}
						).fields
					)
				}))
			};
		}
	}

	return `// Generated automatically. Do not edit.

export const collections = ${JSON.stringify(collections, null, 2)} as const;

export type CollectionName = keyof typeof collections;

export const templateNames = ${JSON.stringify(templateNames)} as const;
`;
}
