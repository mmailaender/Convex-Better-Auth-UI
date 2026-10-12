<script lang="ts">
	import { Combobox as ComboboxPrimitive } from '@ark-ui/svelte/combobox';
	import { cn } from '#lib/primitives/utils.js';

	type ComboboxItemIndicatorProps = ComboboxPrimitive.ItemIndicatorProps & {
		class?: string;
	};

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ComboboxItemIndicatorProps = $props();
</script>

<ComboboxPrimitive.ItemIndicator bind:ref class={cn('relative', className)} {...restProps} />
