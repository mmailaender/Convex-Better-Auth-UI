<script lang="ts">
	import { Menu as MenuPrimitive } from '@ark-ui/svelte';
	import { cn } from '$lib/primitives/utils';
	let {
		ref = $bindable(null),
		class: className,
		inset,
		...restProps
	}: MenuPrimitive.ItemGroupLabelProps & {
		inset?: boolean;
	} = $props();
</script>

<MenuPrimitive.ItemGroupLabel
	bind:ref
	data-slot="menu-group-heading"
	data-inset={inset}
	class={cn('px-2 py-1.5 text-sm font-semibold data-[inset]:pl-8', className)}
	{...restProps}
/>
