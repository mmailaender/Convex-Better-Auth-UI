<script lang="ts">
	import { AvatarFallback as ArkAvatarFallback, type AvatarFallbackProps } from '@ark-ui/svelte';
	import { cn } from '$lib/primitives/utils.js';

	let { ref = $bindable(null), class: className, ...restProps }: AvatarFallbackProps = $props();
</script>

<ArkAvatarFallback
	bind:ref
	class={cn('bg-muted flex size-full items-center justify-center rounded-full', className)}
	{...restProps}
/>
