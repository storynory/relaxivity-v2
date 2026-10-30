/** Use stories from this page, with its title to distinguish paginated archives. */
export function storyDescription(items: Record<string, unknown>[], title: string): string {
	const audio = items.filter((item) => item.collection === 'audio');
	const examples = (audio.length ? audio : items)
		.map((item) => typeof item.title === 'string' ? item.title.replace(/\s+/g, ' ').trim() : '')
		.filter(Boolean).slice(0, 2);
	return examples.length
		? `Audio Stories including ${examples.join(' and ')}. ${title}.`
		: `Audio Stories. ${title}.`;
}
