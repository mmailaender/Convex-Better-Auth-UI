<script lang="ts">
	import { Combobox as ComboboxPrimitive } from '@ark-ui/svelte/combobox';
	import { cn } from '#lib/primitives/utils.js';

	type ComboboxInputProps = ComboboxPrimitive.InputProps & {
		class?: string;
	};

	let { ref = $bindable(null), class: className, ...restProps }: ComboboxInputProps = $props();
</script>

<ComboboxPrimitive.Input
	bind:ref
	class={cn(
		'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 pr-10 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...restProps}
/>
