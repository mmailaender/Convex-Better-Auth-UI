<script lang="ts">
	import { Combobox as ComboboxPrimitive } from '@ark-ui/svelte/combobox';
	import { cn } from '#lib/primitives/utils.js';

	type ComboboxItemGroupLabelProps = ComboboxPrimitive.ItemGroupLabelProps & {
		class?: string;
	};

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ComboboxItemGroupLabelProps = $props();
</script>

<ComboboxPrimitive.ItemGroupLabel bind:ref class={cn('relative', className)} {...restProps} />
