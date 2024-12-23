<script lang="ts">
	import { type User } from '$lib/auth/user';
	import SignOutButton from '$lib/auth/SignOutButton.svelte';
	import { page } from '$app/state'; 

	let user: User | null = $derived(page.data.user ? JSON.parse(page.data.user) : null);

</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	{#if user}
		Hello {user.email}
		<SignOutButton />
	{:else}
		Secret things ahead!
		<a class="btn preset-filled-primary-500" href="/sign-in">Sign in</a>
	{/if}
</div>
