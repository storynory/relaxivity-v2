import { marked } from 'marked';

export async function renderMarkdown(body: string) {
	return marked.parse(body);
}
