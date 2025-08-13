<script lang="ts">
	import { ComboboxContent as ArkComboboxContent } from '@ark-ui/svelte/combobox';
	import type { ComboboxContentProps as ArkComboboxContentProps } from '@ark-ui/svelte/combobox';
	import { cn } from '$lib/primitives/utils.js';

	type ComboboxContentProps = ArkComboboxContentProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxContentProps = $props();
</script>

<ArkComboboxContent
	bind:ref
	class={cn(
		'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md',
		className
	)}
	{...restProps}
/>
