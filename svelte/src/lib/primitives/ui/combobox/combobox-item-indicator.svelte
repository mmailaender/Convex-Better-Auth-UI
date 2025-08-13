<script lang="ts">
	import { ComboboxItemIndicator as ArkComboboxItemIndicator } from '@ark-ui/svelte/combobox';
	import type { ComboboxItemIndicatorProps as ArkComboboxItemIndicatorProps } from '@ark-ui/svelte/combobox';
	import { cn } from '$lib/primitives/utils.js';

	type ComboboxItemIndicatorProps = ArkComboboxItemIndicatorProps & {
		class?: string;
	};

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ComboboxItemIndicatorProps = $props();
</script>

<ArkComboboxItemIndicator bind:ref class={cn('relative', className)} {...restProps} />
