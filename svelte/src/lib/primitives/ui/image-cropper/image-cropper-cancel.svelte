<script lang="ts">
	import { useImageCropperCancel } from './image-cropper.svelte.js';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { cn } from '$lib/primitives/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	type ButtonProps = HTMLAttributes<HTMLButtonElement> & {
		ref?: HTMLButtonElement | null;
	};

	let { ref = $bindable(null), onclick, class: className, ...rest }: ButtonProps = $props();

	const cancelState = useImageCropperCancel();
</script>

<button
	{...rest}
	bind:this={ref}
	class={cn('btn preset-outlined-surface-500', className)}
	onclick={(
		e: MouseEvent & {
			currentTarget: EventTarget & HTMLButtonElement;
		}
	) => {
		onclick?.(e);

		cancelState.onclick();
	}}
>
	<Trash2Icon class="size-5" />
	<span>Cancel</span>
</button>
