<script lang="ts">
	import { Dialog as ArkDialog, type DialogTitleProps } from '@ark-ui/svelte/dialog';
	import { cn } from '$lib/primitives/utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: DialogTitleProps = $props();
</script>

<ArkDialog.Title
	bind:ref
	data-slot="drawer-title"
	class={cn('pb-6 text-left text-xl leading-none tracking-tight', className)}
	{...restProps}
/>
