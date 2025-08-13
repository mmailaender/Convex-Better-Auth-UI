<script lang="ts">
	import {
		Dialog as ArkDialog,
		type DialogContentProps,
		type DialogPositionerProps
	} from '@ark-ui/svelte/dialog';
	import { Portal as ArkPortal, type PortalProps } from '@ark-ui/svelte/portal';
	import type { Snippet } from 'svelte';
	import DrawerBackdrop from './drawer-backdrop.svelte';
	import { cn, type WithoutChildrenOrChild } from '$lib/primitives/utils.js';

	type Side = 'bottom' | 'top' | 'left' | 'right';

	let {
		ref = $bindable(null),
		class: className,
		side = 'bottom' as Side,
		portalProps,
		positionerProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<DialogContentProps> & {
		portalProps?: PortalProps;
		positionerProps?: DialogPositionerProps;
		children: Snippet;
		side?: Side;
	} = $props();
</script>

<ArkPortal {...portalProps}>
	<DrawerBackdrop />
	<ArkDialog.Positioner {...positionerProps}>
		<ArkDialog.Content
			bind:ref
			data-scope="drawer"
			class={cn(
				'group/drawer-content bg-surface-100-900 fixed z-50 flex h-auto flex-col p-6',
				side === 'top' && 'inset-x-0 top-0 mb-24 max-h-[80vh] rounded-b-lg ',
				side === 'bottom' && 'inset-x-0 bottom-0 mt-24 max-h-[80vh] rounded-t-lg',
				side === 'right' && 'inset-y-0 right-0 w-3/4 sm:max-w-sm',
				side === 'left' && 'inset-y-0 left-0 w-3/4 sm:max-w-sm',
				'data-[state=open]:animate-in data-[state=closed]:animate-out',
				'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
				className
			)}
			{...restProps}
		>
			{@render children?.()}
		</ArkDialog.Content>
	</ArkDialog.Positioner>
</ArkPortal>
