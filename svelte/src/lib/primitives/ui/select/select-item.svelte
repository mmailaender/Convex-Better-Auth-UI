<script lang="ts">
	import { Select, type SelectItemProps } from '@ark-ui/svelte/select';
	import { cn } from '$lib/primitives/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: SelectItemProps = $props();
</script>

<Select.Item
	bind:ref
	data-slot="select-item"
	class={cn(
		"data-[highlighted]:bg-surface-200-800 data-[highlighted]:text-surface-950-50 text-surface-800-200 [&_svg:not([class*='text-'])]:text-muted-foreground rounded-base relative flex w-full cursor-pointer items-center gap-2 py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</Select.Item>
