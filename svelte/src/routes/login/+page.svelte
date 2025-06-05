<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { useAuth } from '@mmailaender/convex-auth-svelte/sveltekit';
	const signIn = $derived(useAuth().signIn);

	/**
	 * Handles sign in with the specified provider
	 */
	function handleSignIn(): void {
		const redirectTo = page.url.searchParams.get('redirectTo');

		if (redirectTo) {
			void signIn('github', { redirectTo });
		} else {
			void signIn('github');
		}
	}
</script>

<div class="flex w-full items-center justify-center">
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
