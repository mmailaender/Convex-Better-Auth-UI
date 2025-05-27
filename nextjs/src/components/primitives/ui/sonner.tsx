'use client';

import React from 'react';
import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner';

// Toast variant types
type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

// Base toast properties
interface BaseToastProps {
	id: string | number;
	title?: string;
	description?: string;
	variant?: ToastVariant;
	action?: {
		label: string;
		onClick: () => void;
	};
	cancel?: {
		label: string;
		onClick: () => void;
	};
	onDismiss?: () => void;
}

// Toast options for the public API
interface ToastOptions {
	description?: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	cancel?: {
		label: string;
		onClick: () => void;
	};
	onDismiss?: () => void;
}

// Promise toast options
interface PromiseToastOptions<T> {
	loading: string;
	success: string | ((data: T) => string);
	error: string | ((error: unknown) => string);
}

// Get variant styles based on your existing classes
function getVariantStyles(variant: ToastVariant) {
	const baseClasses =
		'flex rounded-container shadow-lg ring-1 w-full md:max-w-[364px] items-center p-4 transition-all';

	switch (variant) {
		case 'success':
			return `${baseClasses} bg-success-50-950 text-success-950-50 border-success-200-800`;
		case 'error':
			return `${baseClasses} bg-error-50-950 text-error-950-50 border-error-200-800`;
		case 'warning':
			return `${baseClasses} bg-warning-50-950 text-warning-950-50 border-warning-200-800`;
		case 'info':
			return `${baseClasses} bg-surface-50-950 text-surface-900-100 border-surface-200-800`;
		case 'loading':
			return `${baseClasses} bg-surface-50-950 text-surface-900-100 border-surface-200-800`;
		default:
			return `${baseClasses} bg-surface-50-950 text-surface-900-100 border-surface-200-800`;
	}
}

// Get icon for each variant (you can replace with your preferred icons)
function getVariantIcon(variant: ToastVariant) {
	switch (variant) {
		case 'success':
			return '✓';
		case 'error':
			return '✕';
		case 'warning':
			return '⚠';
		case 'info':
			return 'ℹ';
		case 'loading':
			return '⟳';
		default:
			return null;
	}
}

// Main Toast Component
function Toast(props: BaseToastProps) {
	const { title, description, variant = 'default', action, cancel, id, onDismiss } = props;
	const icon = getVariantIcon(variant);

	const handleDismiss = () => {
		sonnerToast.dismiss(id);
		onDismiss?.();
	};

	return (
		<div className={getVariantStyles(variant)}>
			<div className="flex flex-1 items-center gap-3">
				{icon && (
					<div className="flex-shrink-0 text-lg">
						{variant === 'loading' ? <div className="animate-spin">{icon}</div> : icon}
					</div>
				)}
				<div className="min-w-0 flex-1">
					{title && <p className="truncate text-sm font-medium">{title}</p>}
					{description && (
						<p className="text-surface-600-400 mt-1 line-clamp-2 text-xs">{description}</p>
					)}
				</div>
			</div>

			<div className="ml-3 flex items-center gap-2">
				{cancel && (
					<button
						className="btn hover:preset-tonal px-2 py-1 text-xs"
						onClick={() => {
							cancel.onClick();
							handleDismiss();
						}}
					>
						{cancel.label}
					</button>
				)}
				{action && (
					<button
						className="btn preset-filled-primary-500 px-2 py-1 text-xs"
						onClick={() => {
							action.onClick();
							handleDismiss();
						}}
					>
						{action.label}
					</button>
				)}
				<button className="btn hover:preset-tonal ml-1 p-1 text-xs" onClick={handleDismiss}>
					✕
				</button>
			</div>
		</div>
	);
}

// Create the toast API that matches Sonner's interface
function createToast(title: string, options?: ToastOptions, variant: ToastVariant = 'default') {
	return sonnerToast.custom((id) => (
		<Toast
			id={id}
			title={title}
			description={options?.description}
			variant={variant}
			action={options?.action}
			cancel={options?.cancel}
			onDismiss={options?.onDismiss}
		/>
	));
}

// Promise toast function
function promiseToast<T>(
	promise: Promise<T> | (() => Promise<T>),
	msgs: PromiseToastOptions<T>,
	options?: Pick<ToastOptions, 'action' | 'cancel' | 'onDismiss'>
) {
	const promiseToExecute = typeof promise === 'function' ? promise() : promise;

	// Show loading toast
	const loadingToastId = createToast(msgs.loading, options, 'loading');

	return promiseToExecute
		.then((data) => {
			sonnerToast.dismiss(loadingToastId);
			const successMsg = typeof msgs.success === 'function' ? msgs.success(data) : msgs.success;
			return createToast(successMsg, options, 'success');
		})
		.catch((error) => {
			sonnerToast.dismiss(loadingToastId);
			const errorMsg = typeof msgs.error === 'function' ? msgs.error(error) : msgs.error;
			return createToast(errorMsg, options, 'error');
		});
}

// Main toast function with all the methods
const toast = Object.assign(
	// Default toast
	(title: string, options?: ToastOptions) => createToast(title, options),
	{
		// Message toast (same as default but more explicit)
		message: (title: string, options?: ToastOptions) => createToast(title, options),

		// Success toast
		success: (title: string, options?: ToastOptions) => createToast(title, options, 'success'),

		// Error toast
		error: (title: string, options?: ToastOptions) => createToast(title, options, 'error'),

		// Warning toast
		warning: (title: string, options?: ToastOptions) => createToast(title, options, 'warning'),

		// Info toast
		info: (title: string, options?: ToastOptions) => createToast(title, options, 'info'),

		// Loading toast
		loading: (title: string, options?: ToastOptions) => createToast(title, options, 'loading'),

		// Promise toast
		promise: promiseToast,

		// Custom toast (for JSX elements)
		custom: (jsx: React.ReactElement) => sonnerToast.custom(() => jsx),

		// Dismiss methods
		dismiss: (id?: string | number) => sonnerToast.dismiss(id),

		// Dismiss all
		dismissAll: () => sonnerToast.dismiss()
	}
);

export { toast, Toast, SonnerToaster as Toaster };
