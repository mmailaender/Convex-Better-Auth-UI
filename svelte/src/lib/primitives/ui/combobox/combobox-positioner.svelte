<script lang="ts">
	import { ComboboxPositioner as ArkComboboxPositioner } from '@ark-ui/svelte/combobox';
	import type { ComboboxPositionerProps as ArkComboboxPositionerProps } from '@ark-ui/svelte/combobox';
	import { cn } from '$lib/primitives/utils.js';

	type ComboboxPositionerProps = ArkComboboxPositionerProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxPositionerProps = $props();
</script>

<ArkComboboxPositioner bind:ref class={cn('relative', className)} {...restProps} />
