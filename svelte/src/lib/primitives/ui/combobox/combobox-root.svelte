<script lang="ts">
	import { ComboboxRoot as ArkComboboxRoot } from '@ark-ui/svelte/combobox';
	import type { ComboboxRootProps as ArkComboboxRootProps } from '@ark-ui/svelte/combobox';
	import { cn } from '$lib/primitives/utils.js';

	type ComboboxRootProps = ArkComboboxRootProps<any> & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxRootProps = $props();
</script>

<ArkComboboxRoot bind:ref class={cn('relative', className)} {...restProps} />
