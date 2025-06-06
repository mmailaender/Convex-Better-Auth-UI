<script lang="ts">
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from 'svelte-sonner';
	// Icons
	import { CircleCheck, CircleX, AlertTriangle, Info, Loader2 } from '@lucide/svelte';

	let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
	toastOptions={{
		unstyled: true,
		classes: {
			toast:
				'flex flex-row rounded-container shadow-lg w-full md:w-96 items-center p-3 transition-all font-medium gap-2 pointer-events-auto',
			title: 'truncate text-sm font-medium',
			description: 'text-surface-600-400 mt-1 line-clamp-2 text-xs',
			action: '',
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
	{...restProps}
>
	{#snippet loadingIcon()}
		<Loader2 class="flex-shrink-0 animate-spin" />
	{/snippet}
	{#snippet successIcon()}
		<CircleCheck class="text-success-500" />
	{/snippet}
	{#snippet errorIcon()}
		<CircleX class="text-error-500" />
	{/snippet}
	{#snippet infoIcon()}
		<Info />
	{/snippet}
	{#snippet warningIcon()}
		<AlertTriangle />
	{/snippet}
</Sonner>

<style>
	:global(.sonner-loader) {
		position: static !important;
		transform: none !important;
	}
</style>
