'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';

import { cn } from '@/components/lib/utils';

function Root({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function Trigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function Portal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function Close({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function CloseX({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return (
		<DialogPrimitive.Close
			data-slot="dialog-close"
			{...props}
			className="hover:bg-surface-300-700 absolute top-5 right-4 rounded-lg p-2 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
		>
			<XIcon />
			<span className="sr-only">Close</span>
		</DialogPrimitive.Close>
	);
}

function Overlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
	return (
		<DialogPrimitive.Overlay
			data-slot="dialog-overlay"
			className={cn(
				'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-surface-950/80 fixed inset-0 z-50',
				className
			)}
			{...props}
		/>
	);
}

function Content({
	className,
	children,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
	return (
		<Portal data-slot="dialog-portal">
			<Overlay />
			<DialogPrimitive.Content
				data-slot="dialog-content"
				className={cn(
					'bg-surface-200-800 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-container fixed top-[50%] left-[50%] z-50 grid w-[90%] translate-x-[-50%] translate-y-[-50%] overflow-hidden p-6 duration-200 sm:w-4xl',
					className
				)}
				{...props}
			>
				{children}
			</DialogPrimitive.Content>
		</Portal>
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
			className={cn('pb-6 text-left text-xl leading-none tracking-tight', className)}
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
	//
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
