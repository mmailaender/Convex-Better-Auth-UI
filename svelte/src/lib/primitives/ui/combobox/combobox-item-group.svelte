<script lang="ts">
	import { ComboboxItemGroup as ArkComboboxItemGroup } from '@ark-ui/svelte/combobox';
	import type { ComboboxItemGroupProps as ArkComboboxItemGroupProps } from '@ark-ui/svelte/combobox';
	import { cn } from '$lib/primitives/utils.js';

	type ComboboxItemGroupProps = ArkComboboxItemGroupProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxItemGroupProps = $props();
</script>

<ArkComboboxItemGroup bind:ref class={cn('relative', className)} {...restProps} />
