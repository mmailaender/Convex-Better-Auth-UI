<script lang="ts">
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from 'svelte-sonner';
	import { mode } from 'mode-watcher';

	let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
	theme={mode.current}
	class="toaster group"
	toastOptions={{
		unstyled: true,
		classes: {
			default:
				'flex flex-row rounded-container shadow-lg w-full md:w-96 items-center p-3 transition-all font-medium z-50 gap-2 bg-surface-950 dark:bg-surface-800 text-surface-50'
		}
	}}
	{...restProps}
/>
<!-- <Sonner
	theme={mode.current}
	class="toaster group"
	style="--normal-bg: var(--popover); --normal-text: var(--popover-foreground); --normal-border: var(--border);"
	{...restProps}
/> -->
