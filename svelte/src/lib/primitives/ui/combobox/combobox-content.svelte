<script lang="ts">
	import { ComboboxContent as ArkComboboxContent } from '@ark-ui/svelte/combobox';
	import type { ComboboxContentProps as ArkComboboxContentProps } from '@ark-ui/svelte/combobox';
	import { cn } from '$lib/primitives/utils.js';

	type ComboboxContentProps = ArkComboboxContentProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxContentProps = $props();
</script>

<ArkComboboxContent bind:ref class={cn('relative', className)} {...restProps} />
