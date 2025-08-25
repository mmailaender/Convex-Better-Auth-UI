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
				'bg-surface-50-950 dark:bg-surface-100-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-container fixed top-[50%] left-[50%] z-50 grid w-[90%] translate-x-[-50%] translate-y-[-50%]   overflow-scroll duration-200 ',
				className
			)}
			{...restProps}
		>
			{@render children?.()}
		</ArkDialog.Content>
	</ArkDialog.Positioner>
</ArkPortal>
