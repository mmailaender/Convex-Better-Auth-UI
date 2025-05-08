<script lang="ts">
	import { useAuth } from '@convex-dev/auth/sveltekit';
	import { page } from '$app/state';
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
</div>
