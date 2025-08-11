<script lang="ts">
	import {
		DialogBackdrop as ArkDialogBackdrop,
		type DialogBackdropProps
	} from '@ark-ui/svelte/dialog';
	import { cn } from '$lib/primitives/utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: DialogBackdropProps = $props();
</script>

<ArkDialogBackdrop
	bind:ref
	data-slot="dialog-overlay"
	class={cn(
		'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-surface-950/80 fixed inset-0 z-50',
		className
	)}
	{...restProps}
/>
