<script lang="ts">
	import type { User } from '$lib/db/schema/types/custom';
	import { page } from '$app/state';
	import UserProfile from '$lib/auth/UserProfile.svelte';

	let user: User | null = $derived(page.data.user ? JSON.parse(page.data.user) : null);
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	{#if user}
		Hello {user.primaryEmail}
	{/if}

	
	<UserProfile />
</div>
