<script lang="ts">
	import { Combobox as ComboboxPrimitive } from '@ark-ui/svelte/combobox';
	import { cn } from '#lib/primitives/utils.js';

	type ComboboxLabelProps = ComboboxPrimitive.LabelProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxLabelProps = $props();
</script>

<ComboboxPrimitive.Label bind:ref class={cn('relative', className)} {...restProps} />
