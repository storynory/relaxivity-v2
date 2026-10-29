<script lang="ts">
	import type { StoryOrder } from '#lib/audio/story-order.ts';
	let { value = $bindable<StoryOrder>('newest'), manual = false, label = 'Order', onchange }: {
		value?: StoryOrder; manual?: boolean; label?: string; onchange?: () => void | Promise<void>;
	} = $props();
</script>

<label>
	<span>{label}</span>
	<select value={value} onchange={(event) => { value = event.currentTarget.value as StoryOrder; void onchange?.(); }}>
		{#if manual}<option value="manual">My order</option>{/if}
		<option value="newest">Newest first</option>
		<option value="oldest">Oldest first</option>
		<option value="title-asc">Title A–Z</option>
		<option value="title-desc">Title Z–A</option>
	</select>
</label>

<style>
	label { display: inline-flex; align-items: center; gap: 0.6rem; font-size: 0.9em; }
	select { min-height: 44px; max-width: 100%; padding: 0.5em; border: 1px solid var(--text); border-radius: var(--radius); color: var(--text); background: var(--prime); font: inherit; }
</style>
