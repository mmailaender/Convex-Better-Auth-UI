<script lang="ts">
	import { TabContent as ArkTabContent, type TabContentProps } from '@ark-ui/svelte';
	import { cn } from '$lib/primitives/utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: TabContentProps = $props();
</script>

<ArkTabContent
	bind:ref
	data-slot="tabs-content"
	class={cn(
		'outline-none',
		'data-[orientation=horizontal]:flex-1',
		'w-full data-[orientation=vertical]:p-6',
		className
	)}
	{...restProps}
/>
