<script lang="ts">
	import { Menu as MenuPrimitive } from '@ark-ui/svelte';
	import { cn } from '#lib/primitives/utils.js';
	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: MenuPrimitive.SeparatorProps = $props();
</script>

<MenuPrimitive.Separator
	bind:ref
	data-slot="menu-separator"
	class={cn('border-surface-300-700 -mx-1 my-1', className)}
	{...restProps}
/>
