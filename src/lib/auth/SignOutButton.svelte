<script lang="ts">
	import { goto } from '$app/navigation';

	interface Props {
		redirectUrl?: string;
		className?: string;
		children?: import('svelte').Snippet;
	}

	let { redirectUrl = '/', className = 'btn preset-filled-primary-500', children }: Props = $props();

	let buttonText: string = 'Sign Out';

	async function handleSignOut() {
		try {
			const response = await fetch('/api/auth/sign-out');
			if (response.ok) {
				// Redirect after successful sign-out
				goto(redirectUrl);
			} else {
				console.error('Sign-out failed');
			}
		} catch (error) {
			console.error('Error during sign-out:', error);
		}
	}
</script>

<button class={className} onclick={handleSignOut}>
	{#if children}{@render children()}{:else}{buttonText}{/if}
</button>
