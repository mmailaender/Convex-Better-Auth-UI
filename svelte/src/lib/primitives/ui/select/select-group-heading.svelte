<script lang="ts">
	import { Select, type SelectItemGroupLabelProps } from '@ark-ui/svelte/select';
	import { cn } from '$lib/primitives/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: SelectItemGroupLabelProps = $props();
</script>

<Select.ItemGroupLabel
	bind:ref
	data-slot="select-group-heading"
	class={cn('text-muted-foreground px-2 py-1.5 text-xs', className)}
	{...restProps}
>
	{@render children?.()}
</Select.ItemGroupLabel>
