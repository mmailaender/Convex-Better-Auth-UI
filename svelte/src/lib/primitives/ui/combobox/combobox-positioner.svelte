<script lang="ts">
	import { Combobox as ComboboxPrimitive } from '@ark-ui/svelte/combobox';
	import { cn } from '#lib/primitives/utils.js';

	type ComboboxPositionerProps = ComboboxPrimitive.ComboboxPositionerProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxPositionerProps = $props();
</script>

<ComboboxPrimitive.Positioner bind:ref class={cn('relative', className)} {...restProps} />
