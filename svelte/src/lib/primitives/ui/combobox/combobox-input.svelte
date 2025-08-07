<script lang="ts">
	import { ComboboxInput as ArkComboboxInput } from '@ark-ui/svelte/combobox';
	import type { ComboboxInputProps as ArkComboboxInputProps } from '@ark-ui/svelte/combobox';
	import { cn } from '$lib/primitives/utils.js';

	type ComboboxInputProps = ArkComboboxInputProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxInputProps = $props();
</script>

<ArkComboboxInput bind:ref class={cn('relative', className)} {...restProps} />
