<script lang="ts">
	import { cn } from '$lib/primitives/utils';
	import { Menu as MenuPrimitive } from '@ark-ui/svelte';
	let {
		ref = $bindable(null),
		class: className,
		inset,
		variant = 'default',
		...restProps
	}: MenuPrimitive.ItemProps & {
		inset?: boolean;
		variant?: 'default' | 'destructive';
	} = $props();
</script>

<MenuPrimitive.Item
	bind:ref
	data-slot="menu-item"
	data-inset={inset}
	data-variant={variant}
	class={cn(
		"data-highlighted:bg-surface-200-800/50 data-highlighted:text-surface-950-50 data-[variant=destructive]:text-error-500 data-[variant=destructive]:data-highlighted:bg-destructive/10 dark:data-[variant=destructive]:data-highlighted:bg-destructive/20 data-[variant=destructive]:data-highlighted:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground rounded-base relative flex h-8 cursor-pointer items-center gap-3.5 px-4 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 ",
		className
	)}
	{...restProps}
/>
