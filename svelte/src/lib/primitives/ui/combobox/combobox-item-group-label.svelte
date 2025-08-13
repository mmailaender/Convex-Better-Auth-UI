<script lang="ts">
	import { ComboboxItemGroupLabel as ArkComboboxItemGroupLabel } from '@ark-ui/svelte/combobox';
	import type { ComboboxItemGroupLabelProps as ArkComboboxItemGroupLabelProps } from '@ark-ui/svelte/combobox';
	import { cn } from '$lib/primitives/utils.js';

	type ComboboxItemGroupLabelProps = ArkComboboxItemGroupLabelProps & {
		class?: string;
	};

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ComboboxItemGroupLabelProps = $props();
</script>

<ArkComboboxItemGroupLabel bind:ref class={cn('relative', className)} {...restProps} />
