<script lang="ts">
	import { Combobox as ComboboxPrimitive } from '@ark-ui/svelte/combobox';
	import { cn } from '#lib/primitives/utils.js';

	type ComboboxItemGroupProps = ComboboxPrimitive.ItemGroupProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxItemGroupProps = $props();
</script>

<ComboboxPrimitive.ItemGroup bind:ref class={cn('relative', className)} {...restProps} />
