<script lang="ts">
	import { cn, type WithElementRef } from '$lib/primitives/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="drawer-footer"
	class={cn('sticky bottom-0 mt-auto flex flex-row gap-2 pt-6', className)}
	{...restProps}
>
	{@render children?.()}
</div>
