<script lang="ts">
	import { Menu as MenuPrimitive } from '@ark-ui/svelte';
	import { cn, type WithoutChild } from '$lib/primitives/utils.js';
	let {
		ref = $bindable(null),
		class: className,
		children: childrenProp,
		...restProps
	}: WithoutChild<MenuPrimitive.RadioItemProps> = $props();
</script>

<MenuPrimitive.RadioItem
	bind:ref
	data-slot="menu-radio-item"
	class={cn(
		"focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	{@render childrenProp?.()}
</MenuPrimitive.RadioItem>
