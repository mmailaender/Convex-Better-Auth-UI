<script lang="ts">
	import { ComboboxLabel as ArkComboboxLabel } from '@ark-ui/svelte/combobox';
	import type { ComboboxLabelProps as ArkComboboxLabelProps } from '@ark-ui/svelte/combobox';
	import { cn } from '$lib/primitives/utils.js';

	type ComboboxLabelProps = ArkComboboxLabelProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxLabelProps = $props();
</script>

<ArkComboboxLabel bind:ref class={cn('relative', className)} {...restProps} />
