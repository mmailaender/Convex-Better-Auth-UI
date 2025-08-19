<script lang="ts">
	import { useImageCropperCrop } from './image-cropper.svelte.js';
	import CropIcon from '@lucide/svelte/icons/crop';
	import { cn } from '$lib/primitives/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	type ButtonProps = HTMLAttributes<HTMLButtonElement> & {
		ref?: HTMLButtonElement | null;
	};

	let { ref = $bindable(null), onclick, class: className, ...rest }: ButtonProps = $props();

	const cropState = useImageCropperCrop();
</script>

<button
	{...rest}
	bind:this={ref}
	class={cn('btn preset-filled-primary-500', className)}
	onclick={(
		e: MouseEvent & {
			currentTarget: EventTarget & HTMLButtonElement;
		}
	) => {
		onclick?.(e);

		cropState.onclick();
	}}
>
	<CropIcon />
	<span>Crop</span>
</button>
