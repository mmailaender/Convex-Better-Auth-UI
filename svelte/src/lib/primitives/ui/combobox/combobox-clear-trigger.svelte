<script lang="ts">
	import { ComboboxClearTrigger as ArkComboboxClearTrigger } from '@ark-ui/svelte/combobox';
	import type { ComboboxClearTriggerProps as ArkComboboxClearTriggerProps } from '@ark-ui/svelte/combobox';
	import { cn } from '$lib/primitives/utils.js';

	type ComboboxClearTriggerProps = ArkComboboxClearTriggerProps & {
		class?: string;
	};

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ComboboxClearTriggerProps = $props();
</script>

<ArkComboboxClearTrigger bind:ref class={cn('relative', className)} {...restProps} />
