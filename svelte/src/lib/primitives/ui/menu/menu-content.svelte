<script lang="ts">
	import { cn } from '$lib/primitives/utils';
	import { Menu as MenuPrimitive } from '@ark-ui/svelte';
	let {
		ref = $bindable(null),
		positionerProps,
		class: className,
		...restProps
	}: MenuPrimitive.ContentProps & {
		positionerProps?: MenuPrimitive.PositionerProps;
	} = $props();
</script>

<MenuPrimitive.Positioner {...positionerProps}>
	<MenuPrimitive.Content
		bind:ref
		data-slot="menu-content"
		class={cn(
			'bg-surface-50 dark:bg-surface-900 ' +
				'data-[state=open]:animate-in data-[state=closed]:animate-out ' +
				'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ' +
				'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ' +
				'[&[data-placement^="bottom"]]:slide-in-from-top-2 ' +
				'[&[data-placement^="left"]]:slide-in-from-right-2 ' +
				'[&[data-placement^="right"]]:slide-in-from-left-2 ' +
				'[&[data-placement^="top"]]:slide-in-from-bottom-2 ' +
				'z-50 max-h-[var(--available-height)] min-w-[8rem] origin-[var(--transform-origin)] ' +
				'rounded-container border-surface-100-900/50 overflow-x-hidden overflow-y-auto border  p-1 shadow-md outline-none',
			className
		)}
		{...restProps}
	/>
</MenuPrimitive.Positioner>
