<script lang="ts">
	import { XIcon } from '@lucide/svelte';
	import { Drawer as DrawerPrimitive } from 'vaul-svelte';

	let { ref = $bindable(null), ...restProps }: DrawerPrimitive.CloseProps = $props();
</script>

<DrawerPrimitive.Close
	bind:ref
	data-slot="drawer-close"
	class="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:bg-surface-300-700 absolute top-4 right-4 rounded-lg p-2 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
	{...restProps}
>
	<XIcon />
	<span class="sr-only">Close</span>
</DrawerPrimitive.Close>
