'use client';

import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
	return (
		<Sonner
			position="top-center"
			className="z-50"
			toastOptions={{
				// Base toast styles
				className: '!rounded-container',
				// Style variants for different toast types
				classNames: {
					description: '!text-surface-600-400 !text-xs !mt-1',
					actionButton: '!btn !preset-filled-primary-500',
					cancelButton: '!btn !hover:preset-tonal',
					closeButton: '!btn !hover:preset-tonal',
					// Success toast styles
					success: '!bg-success-50-950 !text-success-950-50 !border-success-200-800',
					// Error toast styles
					error: '!bg-error-50-950 !text-error-950-50 !border-error-200-800',
					// Warning toast styles
					warning: '!bg-warning-50-950 !text-warning-950-50 !border-warning-200-800',
					// Info toast styles
					info: '',
					// Loading toast styles
					loading: '!bg-surface-50-950 !text-surface-900-100 !border-surface-200-800'
				}
			}}
			{...props}
		/>
	);
};

export { Toaster };
