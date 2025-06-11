<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/primitives/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.ContentProps = $props();
</script>

<TabsPrimitive.Content
	bind:ref
	data-slot="tabs-content"
	class={cn(
		'outline-none',
		'group-data-[orientation=horizontal]:flex-1',
		'w-full group-data-[orientation=vertical]:p-6',
		className
	)}
	{...restProps}
/>
