<script lang="ts">
	import {
		Dialog as ArkDialog,
		type DialogPositionerProps,
		type DialogContentProps
	} from '@ark-ui/svelte/dialog';
	import { Portal as ArkPortal, type PortalProps } from '@ark-ui/svelte/portal';
	import type { Snippet } from 'svelte';
	import * as Dialog from './index.js';
	import { cn, type WithoutChildrenOrChild } from '$lib/primitives/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		// onInteractOutside,
		portalProps,
		positionerProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<DialogContentProps> & {
		portalProps?: PortalProps;
		positionerProps?: DialogPositionerProps;
		children: Snippet;
	} = $props();
</script>

<ArkPortal {...portalProps}>
	<Dialog.Backdrop />
	<ArkDialog.Positioner {...positionerProps}>
		<ArkDialog.Content
			bind:ref
			class={cn(
				'bg-surface-50-950 dark:bg-surface-100-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-container fixed top-1/2 left-1/2 z-50  flex w-[90%] -translate-x-1/2 -translate-y-1/2 flex-col items-start overflow-x-hidden overflow-y-auto duration-200',
				className
			)}
			{...restProps}
		>
			{@render children?.()}
		</ArkDialog.Content>
	</ArkDialog.Positioner>
</ArkPortal>
