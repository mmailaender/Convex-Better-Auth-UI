<script lang="ts">
	import { cn } from '$lib/primitives/utils.js';
	import { PopoverTrigger as ArkPopoverTrigger, type PopoverTriggerProps } from '@ark-ui/svelte';

	let { ref = $bindable(null), class: className, ...restProps }: PopoverTriggerProps = $props();
</script>

<ArkPopoverTrigger bind:ref data-slot="popover-trigger" class={cn('', className)} {...restProps} />
