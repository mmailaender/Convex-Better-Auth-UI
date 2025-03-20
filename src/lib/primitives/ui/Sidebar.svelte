<script lang="ts">
	interface Props {
		currentSection?: string;
	}

	let { currentSection = 'Profile' }: Props = $props();
</script>

<aside
	class="rounded-base-l-container bg-surface-200-800 border-surface-400-600 w-full border-r p-6 md:w-1/4"
>
	<ul>
		<li class="text-surface-800-200 mb-4 font-semibold">Account</li>
		<li class="text-surface-600-400">{currentSection}</li>
		<li class="text-surface-800-200 mt-4">Security</li>
	</ul>
</aside>
