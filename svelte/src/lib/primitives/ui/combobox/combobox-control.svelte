<script lang="ts">
	import { Combobox as ComboboxPrimitive } from '@ark-ui/svelte/combobox';
	import { cn } from '#lib/primitives/utils.js';

	type ComboboxControlProps = ComboboxPrimitive.ControlProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxControlProps = $props();
</script>

<ComboboxPrimitive.Control bind:ref class={cn('relative', className)} {...restProps} />
