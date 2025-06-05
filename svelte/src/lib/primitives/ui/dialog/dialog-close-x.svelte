<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { XIcon } from '@lucide/svelte';

	let { ref = $bindable(null), ...restProps }: DialogPrimitive.CloseProps = $props();
</script>

<DialogPrimitive.Close
	bind:ref
	data-slot="dialog-close"
	class="hover:bg-surface-300-700 absolute top-5 right-4 rounded-lg p-2 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
	type="button"
	{...restProps}
>
	<XIcon />
	<span class="sr-only">Close</span>
</DialogPrimitive.Close>
