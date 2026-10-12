<script lang="ts">
	import { Combobox as ComboboxPrimitive } from '@ark-ui/svelte/combobox';
	import { cn } from '#lib/primitives/utils.js';

	type ComboboxClearTriggerProps = ComboboxPrimitive.ClearTriggerProps & {
		class?: string;
	};

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ComboboxClearTriggerProps = $props();
</script>

<ComboboxPrimitive.ClearTrigger bind:ref class={cn('relative', className)} {...restProps} />
