export type StoryOrder = 'manual' | 'newest' | 'oldest' | 'title-asc' | 'title-desc';
type Story = { date?: unknown; title?: unknown; slug?: unknown; collection?: unknown };

export function orderStories<T extends Story>(items: readonly T[], order: StoryOrder): T[] {
	if (order === 'manual') return [...items];
	const timestamp = (value: unknown) => typeof value === 'string' || value instanceof Date
		? new Date(value).getTime() : NaN;
	return [...items].sort((a, b) => {
		let difference = 0;
		if (order === 'newest' || order === 'oldest') {
			const left = timestamp(a.date), right = timestamp(b.date);
			if (Number.isFinite(left) !== Number.isFinite(right)) return Number.isFinite(left) ? -1 : 1;
			if (Number.isFinite(left)) difference = order === 'newest' ? right - left : left - right;
		} else {
			const left = typeof a.title === 'string' ? a.title : '';
			const right = typeof b.title === 'string' ? b.title : '';
			if (!!left !== !!right) return left ? -1 : 1;
			difference = left.localeCompare(right, 'en', { sensitivity: 'base', numeric: true });
			if (order === 'title-desc') difference *= -1;
		}
		return difference || `${a.collection ?? ''}/${a.slug ?? ''}`.localeCompare(`${b.collection ?? ''}/${b.slug ?? ''}`);
	});
}
