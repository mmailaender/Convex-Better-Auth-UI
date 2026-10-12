<script lang="ts">
	import { Combobox as ComboboxPrimitive } from '@ark-ui/svelte/combobox';
	import { cn } from '#lib/primitives/utils.js';

	type ComboboxItemTextProps = ComboboxPrimitive.ItemTextProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxItemTextProps = $props();
</script>

<ComboboxPrimitive.ItemText bind:ref class={cn('relative', className)} {...restProps} />
