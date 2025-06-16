'use client';
import { Toaster as Sonner } from 'sonner';
// Icons
import { CircleCheck, CircleX, AlertTriangle, Info, Loader2 } from 'lucide-react';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
	const toasterContent = (
		<>
			<style jsx global>{`
				.sonner-loader {
					position: static !important;
					transform: none !important;
				}
			`}</style>
			<Sonner
				toastOptions={{
					unstyled: true,
					classNames: {
						toast:
							'flex flex-row rounded-container shadow-lg w-full md:w-96 items-start p-3 transition-all font-medium gap-2 pointer-events-auto',
						title: 'break-words text-sm font-medium leading-tight',
						description: 'text-surface-600-400 mt-1 line-clamp-2 text-xs',
						actionButton: '',
						cancelButton: '',
						closeButton: 'btn hover:preset-tonal ml-auto p-1 text-xs order-last',
						default: 'bg-surface-950 dark:bg-surface-800 text-surface-50',
						info: 'bg-surface-950 dark:bg-surface-800 text-surface-50',
						success: 'bg-surface-950 dark:bg-surface-800 text-surface-50',
						error: 'bg-surface-950 dark:bg-surface-800 text-surface-50',
						loading: 'bg-surface-950 dark:bg-surface-800 text-surface-50',
						warning: 'bg-surface-950 dark:bg-surface-800 text-surface-50'
					}
				}}
				icons={{
					success: <CircleCheck className="text-success-500" />,
					info: <Info />,
					warning: <AlertTriangle />,
					error: <CircleX className="text-error-500" />,
					loading: <Loader2 className="flex-shrink-0 animate-spin" />
				}}
				{...props}
			/>
		</>
	);

	return toasterContent;
};

export { Toaster };
