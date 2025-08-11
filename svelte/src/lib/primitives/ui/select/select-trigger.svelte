<script lang="ts">
	import { Select, type SelectTriggerProps } from '@ark-ui/svelte/select';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { cn, type WithoutChild } from '$lib/primitives/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = 'default',
		...restProps
	}: WithoutChild<SelectTriggerProps> & {
		size?: 'sm' | 'default';
	} = $props();
</script>

<Select.Control>
	<Select.Trigger
		bind:ref
		data-slot="select-trigger"
		data-size={size}
		class={cn(
			"data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 border-surface-300-700 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none select-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
			className
		)}
		{...restProps}
	>
		{@render children?.()}
		<Select.Indicator>
			<ChevronDownIcon class="size-4" />
		</Select.Indicator>
	</Select.Trigger>
</Select.Control>
