<script lang="ts">
	// Svelte
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { goto } from '$app/navigation';

	// API Auth
	import { useAuth } from '@mmailaender/convex-auth-svelte/sveltekit';
	const signIn = $derived(useAuth().signIn);

	let { redirectTo: redirectParam }: { redirectTo?: string } = $props();

	/**
	 * Handles sign in with the specified provider
	 */
	function handleSignIn(): void {
		const redirectUrl =
			redirectParam ??
			page.url.searchParams.get('redirectTo') ??
			(page.url.pathname.includes('/login') ? '/' : page.url.pathname);

		void signIn('github', { redirectTo: redirectUrl });
	}
</script>

<div class="flex h-full w-full items-center justify-center">
	<button class="btn preset-filled-primary-500" onclick={handleSignIn}>
		Sign in with GitHub
	</button>
	{#if env.PUBLIC_E2E_TEST}
		<form
			class="mt-8 flex flex-col gap-2"
			onsubmit={(event) => {
				event.preventDefault();
				const formData = new FormData(event.currentTarget);
				signIn('secret', formData)
					.then(() => {
						goto('/');
					})
					.catch(() => {
						window.alert('Invalid secret');
					});
			}}
		>
			Test only: Sign in with a secret
			<input
				aria-label="Secret"
				type="text"
				name="secret"
				placeholder="secret value"
				class="input"
			/>
			<button class="btn preset-filled" type="submit"> Sign in with secret </button>
		</form>
	{/if}
</div>
