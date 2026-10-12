<script lang="ts">
	import { Combobox as ComboboxPrimitive } from '@ark-ui/svelte/combobox';
	import type { CollectionItem } from '@ark-ui/svelte/collection';
	import { cn } from '#lib/primitives/utils.js';

	type ComboboxRootProps = ComboboxPrimitive.RootProps<CollectionItem> & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxRootProps = $props();
</script>

<ComboboxPrimitive.Root bind:ref class={cn('relative', className)} {...restProps} />
