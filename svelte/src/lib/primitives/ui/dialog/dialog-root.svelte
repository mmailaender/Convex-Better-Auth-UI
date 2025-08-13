<script lang="ts">
	import { Dialog as ArkDialog } from '@ark-ui/svelte/dialog';

	let { open = $bindable(false), onInteractOutside, ...restProps }: ArkDialog.RootProps = $props();
</script>

<ArkDialog.Root
	bind:open
	onInteractOutside={onInteractOutside
		? onInteractOutside
		: (e) => {
				// Access the original DOM event from Ark UI's synthetic event
				const originalEvent = e.detail?.originalEvent || e.detail;

				if (originalEvent && originalEvent.target instanceof Element) {
					// Check if the click was on a Sonner toast
					const sonnerElement = originalEvent.target.closest('[data-sonner-toast]');

					if (sonnerElement) {
						// Prevent dialog from closing when clicking on toast
						e.preventDefault();
						return;
					}
				}
			}}
	{...restProps}
/>
