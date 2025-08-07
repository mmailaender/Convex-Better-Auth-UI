<script lang="ts">
	import { ComboboxItemText as ArkComboboxItemText } from '@ark-ui/svelte/combobox';
	import type { ComboboxItemTextProps as ArkComboboxItemTextProps } from '@ark-ui/svelte/combobox';
	import { cn } from '$lib/primitives/utils.js';

	type ComboboxItemTextProps = ArkComboboxItemTextProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxItemTextProps = $props();
</script>

<ArkComboboxItemText bind:ref class={cn('relative', className)} {...restProps} />
