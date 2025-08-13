<script lang="ts">
	import { TabsRoot as ArkTabsRoot, type TabsRootProps } from '@ark-ui/svelte';
	import { cn } from '$lib/primitives/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		class: className,
		...restProps
	}: TabsRootProps = $props();
</script>

<ArkTabsRoot
	bind:ref
	bind:value
	class={cn(
		'flex',
		'data-[orientation=vertical]:w-full data-[orientation=vertical]:shrink-0 data-[orientation=vertical]:flex-row data-[orientation=vertical]:items-start',
		'data-[orientation=horizontal]:flex-col',
		className
	)}
	{...restProps}
/>
