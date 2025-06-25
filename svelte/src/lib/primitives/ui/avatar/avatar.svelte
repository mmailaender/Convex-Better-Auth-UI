<script lang="ts">
	import { Avatar as AvatarPrimitive } from 'bits-ui';
	import { cn } from '$lib/primitives/utils.js';

	let {
		ref = $bindable(null),
		loadingStatus = $bindable(undefined),
		class: className,
		...restProps
	}: AvatarPrimitive.RootProps & {
		loadingStatus?: AvatarPrimitive.RootProps['loadingStatus'];
	} = $props();

	const baseClass = 'relative flex size-8 shrink-0 overflow-hidden rounded-full';
	const computedClass = cn(baseClass, className);
	console.log('computedClass', computedClass);
</script>

{#if loadingStatus !== undefined}
	<AvatarPrimitive.Root
		bind:ref
		bind:loadingStatus
		data-slot="avatar"
		class={computedClass}
		{...restProps}
	/>
{:else}
	<AvatarPrimitive.Root bind:ref data-slot="avatar" class={computedClass} {...restProps} />
{/if}
