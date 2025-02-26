<script lang="ts">
	import type { User } from '$lib/db/schema/types/custom';
	import { page } from '$app/state';

	let user: User | null = $derived(JSON.parse(page.data.user ?? null));
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	{#if user}
		Hello {user.primaryEmail}
	{/if}
</div>
