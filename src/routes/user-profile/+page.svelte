<script lang="ts">
	import UserProfile from '$lib/auth/UserProfile.svelte';
	import type { PageData } from './$types';
    import { page } from '$app/state';

	let { data }: { data: PageData } = $props();
</script>

<UserProfile />
