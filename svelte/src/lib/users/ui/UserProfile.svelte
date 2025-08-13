<script lang="ts">
	import ProfileInfo from '$lib/users/ui/ProfileInfo.svelte';
	import Emails from '$lib/users/ui/Emails.svelte';
	import DeleteUser from '$lib/users/ui/DeleteUser.svelte';
	import Accounts from './Accounts.svelte';
</script>

<div class="w-full">
	<ProfileInfo />
	<div class="pt-10">
		<Emails />
	</div>
	<div class="flex pt-10">
		<Accounts />
	</div>
	<div class="flex pt-10">
		<DeleteUser />
	</div>
</div>
