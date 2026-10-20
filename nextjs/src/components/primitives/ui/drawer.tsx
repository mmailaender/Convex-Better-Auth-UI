'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from '@ark-ui/react/drawer';
import { XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type RootProps = Omit<React.ComponentProps<typeof DrawerPrimitive.Root>, 'onOpenChange'> & {
	onOpenChange?: (open: boolean) => void;
};

function Root({ onOpenChange, ...props }: RootProps) {
	return (
		<DrawerPrimitive.Root
			data-slot="drawer"
			onOpenChange={onOpenChange ? (details) => onOpenChange(details.open) : undefined}
			{...props}
		/>
	);
}

function Trigger({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
	return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function Close({ ...props }: React.ComponentProps<typeof DrawerPrimitive.CloseTrigger>) {
	return <DrawerPrimitive.CloseTrigger data-slot="drawer-close" {...props} />;
}

function CloseX({
	className,
	children,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.CloseTrigger>) {
	return (
		<DrawerPrimitive.CloseTrigger
			data-slot="drawer-close"
			aria-label="Close"
			className={cn(
				'ring-offset-background focus-visible:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:bg-surface-300-700 rounded-base absolute top-4 right-4 p-2 opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
				className
			)}
			{...props}
		>
			{children ?? <XIcon />}
			<span className="sr-only">Close</span>
		</DrawerPrimitive.CloseTrigger>
	);
}

function Overlay({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Backdrop>) {
	return (
		<DrawerPrimitive.Backdrop
			data-slot="drawer-overlay"
			className={cn(
				'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-surface-950/80 fixed inset-0 z-50',
				className
			)}
			{...props}
		/>
	);
}

function Portal({ children }: { children?: React.ReactNode }) {
	return (
		<DrawerPrimitive.Positioner data-slot="drawer-portal">{children}</DrawerPrimitive.Positioner>
	);
}

function Content({
	className,
	children,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
	return (
		<>
			<Overlay />
			<DrawerPrimitive.Positioner className="fixed inset-0 z-50">
				<DrawerPrimitive.Content
					data-slot="drawer-content"
					className={cn(
						'group/drawer-content bg-surface-100-900 fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col rounded-t-lg p-6',
						className
					)}
					{...props}
				>
					{children}
				</DrawerPrimitive.Content>
			</DrawerPrimitive.Positioner>
		</>
	);
}

function Header({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div data-slot="drawer-header" className={cn('flex flex-col gap-4', className)} {...props} />
	);
}

function Footer({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="drawer-footer"
			className={cn('sticky bottom-0 mt-auto flex flex-row gap-2 pt-6', className)}
			{...props}
		/>
	);
}

function Title({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
	return (
		<DrawerPrimitive.Title
			data-slot="drawer-title"
			className={cn('pb-6 text-left text-xl leading-none tracking-tight', className)}
			{...props}
		/>
	);
}

function Description({
	className,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
	return (
		<DrawerPrimitive.Description
			data-slot="drawer-description"
			className={cn('text-surface-600-400 text-sm', className)}
			{...props}
		/>
	);
}

export {
	Root,
	Content,
	Description,
	Overlay,
	Footer,
	Header,
	Title,
	Trigger,
	Portal,
	Close,
	CloseX,
	Root as Drawer,
	Portal as DrawerPortal,
	Overlay as DrawerOverlay,
	Trigger as DrawerTrigger,
	Close as DrawerClose,
	CloseX as DrawerCloseX,
	Content as DrawerContent,
	Header as DrawerHeader,
	Footer as DrawerFooter,
	Title as DrawerTitle,
	Description as DrawerDescription
};
