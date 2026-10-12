<script lang="ts">
	import { Combobox as ComboboxPrimitive } from '@ark-ui/svelte/combobox';
	import { cn } from '#lib/primitives/utils.js';

	type ComboboxItemProps = ComboboxPrimitive.ItemProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxItemProps = $props();
</script>

<ComboboxPrimitive.Item bind:ref class={cn('relative', className)} {...restProps} />
