<script lang="ts">
	import { type User } from '$lib/auth/user';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let user: User | null = $state(data.user ? JSON.parse(data.user) : null);

	async function handleSignOut() {
		try {
			const response = await fetch('/api/auth/sign-out');
			if (response.ok) {
				user = null;
				// if (redirectUrl) {
				// 	goto(redirectUrl);
				// }
			} else {
				console.error('Sign-out failed');
			}
		} catch (error) {
			console.error('Error during sign-out:', error);
		}
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	{#if user}
		Hello {user.email}
		<button class="btn preset-filled-primary-500" onclick={handleSignOut}>Sign out</button>
	{:else}
		Secret things ahead!
		<a class="btn preset-filled-primary-500" href="/sign-in">Sign in</a>
	{/if}
</div>
