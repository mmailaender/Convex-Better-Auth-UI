<script lang="ts">
	import { TabList as ArkTabList, type TabListProps } from '@ark-ui/svelte';
	import { cn } from '$lib/primitives/utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: TabListProps = $props();
</script>

<ArkTabList
	bind:ref
	data-slot="tabs-list"
	class={cn(
		'text-surface-700-300 rounded-base bg-transparent',
		'inline-flex items-center justify-center',
		'data-[orientation=horizontal]:w-fit',
		'h-full gap-1 data-[orientation=vertical]:w-full data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start data-[orientation=vertical]:justify-start',
		className
	)}
	{...restProps}
/>
