<script lang="ts">
	import ProfileInfo from '$lib/users/ui/ProfileInfo.svelte';
	import Emails from '$lib/users/ui/Emails.svelte';
	import DeleteUser from '$lib/users/ui/DeleteUser.svelte';
	import Accounts from './Accounts.svelte';
</script>

<div class="w-full">
	<div class="flex flex-col gap-3 pb-8">
		<ProfileInfo />

		<Emails />
	</div>

	<div class="flex h-full flex-col">
		<Accounts />
	</div>
	<div>
		<DeleteUser />
	</div>
</div>
