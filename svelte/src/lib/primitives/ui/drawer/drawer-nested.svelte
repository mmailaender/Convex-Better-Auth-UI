<script lang="ts">
	import { Dialog as ArkDialog } from '@ark-ui/svelte/dialog';

	let { open = $bindable(false), onInteractOutside, ...restProps }: ArkDialog.RootProps = $props();
</script>

<ArkDialog.Root
	bind:open
	onInteractOutside={onInteractOutside
		? onInteractOutside
		: (e) => {
				const originalEvent = e.detail?.originalEvent || e.detail;
				if (originalEvent && originalEvent.target instanceof Element) {
					const sonnerElement = originalEvent.target.closest('[data-sonner-toast]');
					if (sonnerElement) {
						e.preventDefault();
						return;
					}
				}
			}}
	{...restProps}
/>
