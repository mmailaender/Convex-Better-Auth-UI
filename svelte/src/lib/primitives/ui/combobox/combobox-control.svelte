<script lang="ts">
	import { ComboboxControl as ArkComboboxControl } from '@ark-ui/svelte/combobox';
	import type { ComboboxControlProps as ArkComboboxControlProps } from '@ark-ui/svelte/combobox';
	import { cn } from '$lib/primitives/utils.js';

	type ComboboxControlProps = ArkComboboxControlProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxControlProps = $props();
</script>

<ArkComboboxControl bind:ref class={cn('relative', className)} {...restProps} />
