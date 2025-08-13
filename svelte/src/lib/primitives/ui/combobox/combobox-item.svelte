<script lang="ts">
	import { ComboboxItem as ArkComboboxItem } from '@ark-ui/svelte/combobox';
	import type { ComboboxItemProps as ArkComboboxItemProps } from '@ark-ui/svelte/combobox';
	import { cn } from '$lib/primitives/utils.js';

	type ComboboxItemProps = ArkComboboxItemProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxItemProps = $props();
</script>

<ArkComboboxItem bind:ref class={cn('relative', className)} {...restProps} />
