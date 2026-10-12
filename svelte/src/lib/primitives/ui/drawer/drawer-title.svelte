<script lang="ts">
	import { Dialog as DialogPrimitive } from '@ark-ui/svelte/dialog';
	import { cn } from '#lib/primitives/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DialogPrimitive.TitleProps = $props();
</script>

<DialogPrimitive.Title
	bind:ref
	data-slot="drawer-title"
	class={cn('pb-6 text-left text-xl leading-none tracking-tight', className)}
	{...restProps}
/>
