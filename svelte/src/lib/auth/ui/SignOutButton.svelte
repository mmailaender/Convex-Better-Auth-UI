<script lang="ts">
	import { cn } from '$lib/primitives/utils';
	import { authClient } from '../api/auth-client';
	import { invalidateAll } from '$app/navigation';

	interface SignOutButtonProps {
		onSuccess?: () => void;
		onError?: () => void;
		class?: string;
	}

	const { onSuccess, onError, class: className }: SignOutButtonProps = $props();

	async function handleSignOut() {
		const result = await authClient.signOut();
		if (result.data?.success) {
			onSuccess?.();
			// Use invalidateAll() to refresh all data and trigger middleware re-execution
			invalidateAll();
		} else {
			onError?.();
		}
	}
</script>

<button
	class={cn(
		'btn preset-faded-surface-50-950 hover:bg-surface-200-800 h-10 justify-between gap-1 text-sm',
		className
	)}
	onclick={handleSignOut}
>
	Sign out
</button>
