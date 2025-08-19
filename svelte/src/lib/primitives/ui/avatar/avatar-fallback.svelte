<script lang="ts">
	import { AvatarFallback as ArkAvatarFallback, type AvatarFallbackProps } from '@ark-ui/svelte';
	import { cn } from '$lib/primitives/utils.js';

	let { class: className, ...restProps }: AvatarFallbackProps = $props();
</script>

<ArkAvatarFallback
	class={cn('bg-muted flex size-full items-center justify-center rounded-full', className)}
	{...restProps}
/>
