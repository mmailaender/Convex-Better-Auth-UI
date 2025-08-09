<script lang="ts">
	import { AvatarRoot as ArkAvatarRoot, type AvatarRootProps } from '@ark-ui/svelte';
	import { cn } from '$lib/primitives/utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: AvatarRootProps = $props();
</script>

<ArkAvatarRoot
	bind:ref
	class={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
	{...restProps}
/>
