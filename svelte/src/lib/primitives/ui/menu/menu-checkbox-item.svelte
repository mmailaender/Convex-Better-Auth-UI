<script lang="ts">
	import { Menu as MenuPrimitive } from '@ark-ui/svelte/menu';
	import CheckIcon from '@lucide/svelte/icons/check';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import { cn, type WithoutChildrenOrChild } from '$lib/primitives/utils';
	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		children: childrenProp,
		closeOnSelect = false,
		...restProps
	}: WithoutChildrenOrChild<MenuPrimitive.CheckboxItemProps & { closeOnSelect?: boolean }> & {
		indeterminate?: boolean;
		children?: Snippet;
	} = $props();

	const ariaChecked = $derived(indeterminate ? 'mixed' : checked ? 'true' : 'false');
</script>

<MenuPrimitive.CheckboxItem
	bind:ref
	bind:checked
	aria-checked={ariaChecked}
	{closeOnSelect}
	data-slot="menu-checkbox-item"
	class={cn(
		"focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	<MenuPrimitive.ItemIndicator
		class="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center"
	>
		{#if indeterminate}
			<MinusIcon class="size-4" />
		{:else}
			<CheckIcon class={cn('size-4', !checked && 'text-transparent')} />
		{/if}
	</MenuPrimitive.ItemIndicator>

	<!-- Label / content -->
	<MenuPrimitive.ItemText>{@render childrenProp?.()}</MenuPrimitive.ItemText>
</MenuPrimitive.CheckboxItem>
