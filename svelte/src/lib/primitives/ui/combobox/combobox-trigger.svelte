<script lang="ts">
	import { ComboboxTrigger as ArkComboboxTrigger } from '@ark-ui/svelte/combobox';
	import type { ComboboxTriggerProps as ArkComboboxTriggerProps } from '@ark-ui/svelte/combobox';
	import { cn } from '$lib/primitives/utils.js';

	type ComboboxTriggerProps = ArkComboboxTriggerProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxTriggerProps = $props();
</script>

<ArkComboboxTrigger bind:ref class={cn('relative', className)} {...restProps} />
