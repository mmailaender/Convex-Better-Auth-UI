<script lang="ts">
	import { type User } from '$lib/auth/user';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import SignOutButton from '$lib/auth/SignOutButton.svelte';

	let { data }: { data: PageData } = $props();

	let user: User | null = $state(data.user ? JSON.parse(data.user) : null);
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
