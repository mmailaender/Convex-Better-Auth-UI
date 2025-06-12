<script lang="ts">
	import ProfileInfo from '$lib/users/ui/ProfileInfo.svelte';
	import DeleteUser from '$lib/users/ui/DeleteUser.svelte';
</script>

<div class="w-full">
	<ProfileInfo />
	<div class="flex pt-10">
		<DeleteUser />
	</div>
</div>
