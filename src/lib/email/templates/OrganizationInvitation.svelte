<script lang="ts">
	/**
	 * @typedef {Object} Props
	 * @property {string} organizationName
	 * @property {string} inviterName
	 * @property {string} acceptUrl
	 */

	/** @type {Props} */
	let { organizationName, inviterName, acceptUrl } = $props();
</script>

<div class="mx-auto max-w-2xl p-8">
	<h1 class="h2 mb-6">You've been invited to join {organizationName}</h1>

	<p class="mb-4">{inviterName} has invited you to join {organizationName}.</p>

	<p class="mb-6">Click the button below to accept this invitation:</p>

	<div class="mb-6">
		<a
			href="${acceptUrl}"
			class="rounded-lg bg-blue-500 px-6 py-2 font-medium text-white no-underline"
		>
			Accept Invitation
		</a>
	</div>

	<div class="text-surface-600 mb-4 text-sm">
		<p>Or copy and paste this URL into your browser:</p>
		<p class="text-primary-500">{acceptUrl}</p>
	</div>

	<p class="text-surface-500 mt-6 text-sm">This invitation will expire in 7 days.</p>

	<p class="text-surface-500 mt-4 text-sm">
		If you don't have an account yet, you'll be able to create one when accepting the invitation.
	</p>
</div>
