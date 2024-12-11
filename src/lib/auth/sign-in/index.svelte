<script lang="ts">
	import Email from './email.svelte';
	import SocialProvider from '../social/provider.svelte';
</script>

<div class="card flex w-full max-w-md flex-col gap-6 border p-6 text-center border-surface-200-800">
	<!-- Title -->
    <div id="auth_sign-in_title" class="flex flex-col gap-3">
		<h2 class="h3 text-center">Sign in or create account</h2>
		<p class="text-center text-surface-600-400">Get started for free</p>
	</div>

	<!-- Social -->
	<SocialProvider />

	<!-- Divider -->
	<div class="flex items-center">
		<hr class="hr" />
		<div class="mx-4 text-surface-500">OR</div>
		<hr class="hr" />
	</div>

	<!-- Email -->
	<Email />

	<p class="text-center text-xs">
		By continuing, you agree to our <a href="#" class="anchor">Terms of Service</a> and
		<a href="#" class="anchor">Privacy Policy</a>.
	</p>
</div>
