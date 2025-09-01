<script lang="ts">
	import { TabTrigger as ArkTabTrigger, type TabTriggerProps } from '@ark-ui/svelte';
	import { cn } from '$lib/primitives/utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: TabTriggerProps = $props();
</script>

<ArkTabTrigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(
		"aria-selected:bg-surface-400-600/50 dark:aria-selected:bg-surface-300-700/50 aria-selected:text-surface-950-50 text-surface-700-300 dark:text-surface-600-400 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring rounded-base inline-flex items-center px-3 py-2 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		'data-[orientation=horizontal]:h-[calc(100%-1px)] data-[orientation=horizontal]:flex-1 data-[orientation=horizontal]:justify-center',
		'hover:bg-surface-500/20 hover:text-surface-950-50 data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start data-[orientation=vertical]:text-left',
		className
	)}
	{...restProps}
/>
