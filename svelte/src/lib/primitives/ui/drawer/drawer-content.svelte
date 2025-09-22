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
			data-side={side}
			class={cn(
				'group/drawer-content bg-surface-100-900 fixed z-50 flex h-auto flex-col p-6',
				side === 'top' && 'inset-x-0 top-0 mb-24 max-h-[80vh] rounded-b-lg ',
				side === 'bottom' && 'inset-x-0 bottom-0 mt-24 max-h-[80vh] rounded-t-lg',
				side === 'right' && 'inset-y-0 right-0 w-3/4 sm:max-w-sm',
				side === 'left' && 'inset-y-0 left-0 w-3/4 sm:max-w-sm',
				// Animate: fade and directional slide based on side + state
				'data-[state=open]:animate-in data-[state=closed]:animate-out duration-200',
				'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
				// Enter animations per side
				'data-[side=left]:data-[state=open]:slide-in-from-left-2',
				'data-[side=right]:data-[state=open]:slide-in-from-right-2',
				'data-[side=top]:data-[state=open]:slide-in-from-top-2',
				'data-[side=bottom]:data-[state=open]:slide-in-from-bottom-2',
				// Exit animations per side
				'data-[side=left]:data-[state=closed]:slide-out-to-left-2',
				'data-[side=right]:data-[state=closed]:slide-out-to-right-2',
				'data-[side=top]:data-[state=closed]:slide-out-to-top-2',
				'data-[side=bottom]:data-[state=closed]:slide-out-to-bottom-2',
				className
			)}
			{...restProps}
		>
			{@render children?.()}
		</ArkDialog.Content>
	</ArkDialog.Positioner>
</ArkPortal>
