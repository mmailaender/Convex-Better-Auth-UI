'use client';

import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
	return (
		<Sonner
			position="top-center"
			className="z-50"
			toastOptions={{
				// Base toast styles
				className: 'rounded-xl border shadow-lg font-medium text-sm p-4',
				// Style variants for different toast types
				classNames: {
					toast:
						'group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg',
					description: 'group-[.toast]:text-slate-500 text-xs mt-1',
					actionButton:
						'group-[.toast]:bg-slate-900 group-[.toast]:text-slate-50 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-800 transition-colors',
					cancelButton:
						'group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-200 transition-colors',
					closeButton:
						'group-[.toast]:bg-slate-200 group-[.toast]:text-slate-500 hover:bg-slate-300 border-0',
					// Success toast styles
					success:
						'group toast group-[.toaster]:bg-emerald-50 group-[.toaster]:text-emerald-900 group-[.toaster]:border-emerald-200',
					// Error toast styles
					error:
						'group toast group-[.toaster]:bg-red-50 group-[.toaster]:text-red-900 group-[.toaster]:border-red-200',
					// Warning toast styles
					warning:
						'group toast group-[.toaster]:bg-amber-50 group-[.toaster]:text-amber-900 group-[.toaster]:border-amber-200',
					// Info toast styles
					info: 'group toast group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-900 group-[.toaster]:border-blue-200',
					// Loading toast styles
					loading:
						'group toast group-[.toaster]:bg-slate-50 group-[.toaster]:text-slate-900 group-[.toaster]:border-slate-200'
				}
			}}
			{...props}
		/>
	);
};

export { Toaster };
