/** Small presentation helpers. The generic route itself knows nothing about content fields. */
export function textField(item: Record<string, unknown>, field: string): string {
	const value = item[field];
	return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

export function relationLabel(value: unknown, field: string): string {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
	const label = (value as Record<string, unknown>)[field];
	return typeof label === 'string' || typeof label === 'number' ? String(label) : '';
}

export function relationLabels(value: unknown, field: string): string[] {
	if (!Array.isArray(value)) return [];
	return value.map((entry) => relationLabel(entry, field)).filter(Boolean);
}
