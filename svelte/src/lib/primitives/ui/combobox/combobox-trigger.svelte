<script lang="ts">
	import { Combobox as ComboboxPrimitive } from '@ark-ui/svelte/combobox';
	import { cn } from '#lib/primitives/utils.js';

	type ComboboxTriggerProps = ComboboxPrimitive.TriggerProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxTriggerProps = $props();
</script>

<ComboboxPrimitive.Trigger bind:ref class={cn('relative', className)} {...restProps} />
