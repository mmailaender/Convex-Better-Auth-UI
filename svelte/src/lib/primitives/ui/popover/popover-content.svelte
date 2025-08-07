<script lang="ts">
	import { cn } from '$lib/primitives/utils.js';
	import {
		PopoverContent as ArkPopoverContent,
		PopoverPositioner as ArkPopoverPositioner,
		type PopoverContentProps,
		type PopoverPositionerProps
	} from '@ark-ui/svelte';

	let {
		ref = $bindable(null),
		class: className,
		positionerProps,
		...restProps
	}: PopoverContentProps & { positionerProps?: PopoverPositionerProps } = $props();
</script>

<ArkPopoverPositioner {...positionerProps}>
	<ArkPopoverContent
		bind:ref
		data-slot="popover-content"
		class={cn(
			'bg-surface-200-800 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2 rounded-container z-50 w-80 p-1 outline-hidden',
			className
		)}
		{...restProps}
	/>
</ArkPopoverPositioner>
