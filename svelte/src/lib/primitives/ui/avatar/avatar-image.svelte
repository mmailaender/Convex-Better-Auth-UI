<script lang="ts">
	// import { Avatar as AvatarPrimitive } from 'bits-ui';
	import { AvatarImage as ArkAvatarImage, type AvatarImageProps } from '@ark-ui/svelte';
	import { cn } from '$lib/primitives/utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: AvatarImageProps = $props();
</script>

<ArkAvatarImage bind:ref class={cn('aspect-square size-full', className)} {...restProps} />
