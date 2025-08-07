<script lang="ts">
	// import { Dialog as DialogPrimitive } from 'bits-ui';
	import {
		DialogDescription as ArkDialogDescription,
		type DialogDescriptionProps
	} from '@ark-ui/svelte/dialog';
	import { cn } from '$lib/primitives/utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: DialogDescriptionProps = $props();
</script>

<ArkDialogDescription
	bind:ref
	data-slot="dialog-description"
	class={cn('text-surface-600-400 w-full text-left text-sm', className)}
	{...restProps}
/>
