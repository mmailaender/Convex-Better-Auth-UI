<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';

	interface Props {
		redirectUrl?: string;
		class?: string;
		children?: import('svelte').Snippet;
	}

	let { redirectUrl, class: className = 'btn preset-filled', children }: Props = $props();

	let buttonText: string = 'Sign Out';

	async function handleSignOut() {
		try {
			const response = await fetch('/api/auth/sign-out');
			if (response.ok) {
                invalidateAll();

				if (redirectUrl) {
					goto(redirectUrl);
				}
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
