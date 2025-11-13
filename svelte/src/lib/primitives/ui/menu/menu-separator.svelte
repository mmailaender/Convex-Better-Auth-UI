<script lang="ts">
	import { Menu as MenuPrimitive } from '@ark-ui/svelte';
	import { cn } from '$lib/primitives/utils.js';
	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: MenuPrimitive.SeparatorProps = $props();
</script>

<MenuPrimitive.Separator
	bind:ref
	data-slot="menu-separator"
	class={cn('bg-border -mx-1 my-1 h-px', className)}
	{...restProps}
/>
