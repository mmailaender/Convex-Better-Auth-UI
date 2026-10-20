'use client';

import * as React from 'react';
import { Dialog as DialogPrimitive } from '@ark-ui/react/dialog';
import { Portal as PortalPrimitive, type PortalProps } from '@ark-ui/react/portal';
import { XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type RootPrimitiveProps = React.ComponentProps<typeof DialogPrimitive.Root>;
type RootProps = Omit<RootPrimitiveProps, 'onOpenChange'> & {
	onOpenChange?: (open: boolean) => void;
};

function Root({ onOpenChange, ...props }: RootProps) {
	return (
		<DialogPrimitive.Root
			data-slot="dialog"
			onOpenChange={onOpenChange ? (details) => onOpenChange(details.open) : undefined}
			{...props}
		/>
	);
}

function Trigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function Close({ ...props }: React.ComponentProps<typeof DialogPrimitive.CloseTrigger>) {
	return <DialogPrimitive.CloseTrigger data-slot="dialog-close" type="button" {...props} />;
}

function CloseX({
	className,
	children,
	...props
}: React.ComponentProps<typeof DialogPrimitive.CloseTrigger>) {
	return (
		<DialogPrimitive.CloseTrigger
			data-slot="dialog-close"
			aria-label="Close"
			type="button"
			className={cn(
				'hover:bg-surface-300-700 rounded-base absolute top-5 right-4 p-2 opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
				className
			)}
			{...props}
		>
			{children ?? <XIcon />}
			<span className="sr-only">Close</span>
		</DialogPrimitive.CloseTrigger>
	);
}

function Overlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Backdrop>) {
	return (
		<DialogPrimitive.Backdrop
			data-slot="dialog-overlay"
			className={cn(
				'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-surface-950/80 fixed inset-0 z-50',
				className
			)}
			{...props}
		/>
	);
}

function Portal({ children, ...props }: PortalProps & { children?: React.ReactNode }) {
	return (
		<PortalPrimitive {...props}>
			<DialogPrimitive.Positioner data-slot="dialog-portal">{children}</DialogPrimitive.Positioner>
		</PortalPrimitive>
	);
}

type ContentProps = Omit<
	React.ComponentProps<typeof DialogPrimitive.Content>,
	'onInteractOutside'
> & {
	onInteractOutside?: (event: {
		preventDefault: () => void;
		detail: { originalEvent: Event };
	}) => void;
};

function Content({ className, children, onInteractOutside, ...props }: ContentProps) {
	void onInteractOutside;
	return (
		<PortalPrimitive>
			<Overlay />
			<DialogPrimitive.Positioner className="fixed inset-0 z-50">
				<DialogPrimitive.Content
					data-slot="dialog-content"
					className={cn(
						'bg-surface-50-950 dark:bg-surface-100-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-container fixed top-1/2 left-1/2 z-50 flex w-[90%] -translate-x-1/2 -translate-y-1/2 flex-col items-start gap-5 overflow-x-hidden overflow-y-auto p-5 duration-200',
						className
					)}
					{...props}
				>
					{children}
				</DialogPrimitive.Content>
			</DialogPrimitive.Positioner>
		</PortalPrimitive>
	);
}

function Header({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="dialog-header"
			className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
			{...props}
		/>
	);
}

function Footer({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="dialog-footer"
			className={cn('flex justify-end gap-2 pt-6 md:flex-row', className)}
			{...props}
		/>
	);
}

function Title({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn('h5 text-left leading-none tracking-tight', className)}
			{...props}
		/>
	);
}

function Description({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			data-slot="dialog-description"
			className={cn('text-surface-600-400 w-full text-left text-sm', className)}
			{...props}
		/>
	);
}

export {
	Root,
	Title,
	Portal,
	Footer,
	Header,
	Trigger,
	Overlay,
	Content,
	Description,
	Close,
	CloseX,
	Root as Dialog,
	Title as DialogTitle,
	Portal as DialogPortal,
	Footer as DialogFooter,
	Header as DialogHeader,
	Trigger as DialogTrigger,
	Overlay as DialogOverlay,
	Content as DialogContent,
	Description as DialogDescription,
	Close as DialogClose,
	CloseX as DialogCloseX
};
