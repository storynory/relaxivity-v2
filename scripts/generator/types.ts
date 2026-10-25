import type { CmsCollection, CmsField } from './config';

function pascalCase(value: string): string {
	const name = value
		.split(/[^a-zA-Z0-9]+/)
		.filter(Boolean)
		.map((part) => part[0].toUpperCase() + part.slice(1))
		.join('');
	return /^[A-Za-z_$]/.test(name) ? name : `Content${name}`;
}

function nameOf(value: string): string {
	return JSON.stringify(value);
}

function fieldType(field: CmsField, indent = 0): string {
	const nested = field.fields ?? (field.field ? [field.field] : undefined);
	let type: string;

	switch (field.widget) {
		case 'boolean':
			type = 'boolean';
			break;
		case 'number':
			type = 'number';
			break;
		case 'object':
			type = nested ? objectType(nested, indent) : 'Record<string, unknown>';
			break;
		case 'list':
			type = nested ? `${objectType(nested, indent)}[]` : 'unknown[]';
			break;
		case 'relation':
			type = field.multiple ? 'string[]' : 'string';
			break;
		case 'select': {
			const options = field.options?.map((option) =>
				typeof option === 'string' ? option : option.value
			);
			const choice = options?.length ? options.map((value) => JSON.stringify(value)).join(' | ') : 'string';
			type = field.multiple ? `(${choice})[]` : choice;
			break;
		}
		case 'datetime':
		case 'date':
		case 'time':
		case 'string':
		case 'text':
		case 'markdown':
		case 'richtext':
		case 'image':
		case 'file':
		case 'color':
		case 'code':
		case 'hidden':
			type = 'string';
			break;
		default:
			// Unknown/custom CMS widgets must not pretend to be strings.
			type = 'unknown';
	}

	return type;
}

function objectType(fields: CmsField[], indent = 0): string {
	if (!fields.length) return 'Record<string, never>';
	const pad = '\t'.repeat(indent + 1);
	const endPad = '\t'.repeat(indent);
	const entries = fields.map((field) => {
		const optional = field.required === false ? '?' : '';
		return `${pad}${nameOf(field.name)}${optional}: ${fieldType(field, indent + 1)};`;
	});
	return `{\n${entries.join('\n')}\n${endPad}}`;
}

export function generateTypes(collections: CmsCollection[]): string {
	const declarations: string[] = [];
	const collectionItems: string[] = [];
	const used = new Set<string>();

	for (const collection of collections) {
		if (collection.folder) {
			const typeName = `${pascalCase(collection.name)}Content`;
			if (used.has(typeName)) throw new Error(`Duplicate type name: ${typeName}`);
			used.add(typeName);
			declarations.push(`export type ${typeName} = ${objectType(collection.fields ?? [])};`);
			collectionItems.push(`\t${nameOf(collection.name)}: ${typeName};`);
		} else if (collection.files) {
			const entries: string[] = [];
			for (const file of collection.files) {
				const typeName = `${pascalCase(collection.name)}${pascalCase(file.name)}Content`;
				if (used.has(typeName)) throw new Error(`Duplicate type name: ${typeName}`);
				used.add(typeName);
				declarations.push(`export type ${typeName} = ${objectType(file.fields ?? [])};`);
				entries.push(`\t\t${nameOf(file.name)}: ${typeName};`);
			}
			collectionItems.push(`\t${nameOf(collection.name)}: {\n${entries.join('\n')}\n\t};`);
		}
	}

	return `// Generated automatically from Sveltia collection YAML. Do not edit.\n\n${declarations.join('\n\n')}\n\nexport type ContentByCollection = {\n${collectionItems.join('\n')}\n};\n`;
}
