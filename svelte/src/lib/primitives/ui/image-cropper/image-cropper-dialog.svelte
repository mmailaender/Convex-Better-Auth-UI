<script lang="ts">
	import * as Dialog from '$lib/primitives/ui/dialog';
	import { cn } from '$lib/primitives/utils';
	import { useImageCropperDialog } from './image-cropper.svelte.js';
	import type { ImageCropperDialogProps } from './types';

	let { children, class: className, ...rest }: ImageCropperDialogProps = $props();

	const dialogState = useImageCropperDialog();
</script>

<Dialog.Root bind:open={dialogState.rootState.open}>
	<Dialog.Content {...rest} class={cn('min-h-96 max-w-full sm:max-w-lg', className)}>
		<div class="flex flex-col gap-4">
			{@render children?.()}
		</div>
	</Dialog.Content>
</Dialog.Root>
