<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} OTP
	 */

	/** @type {Props} */
	let { OTP } = $props();

	const OTPDigits = OTP.split('');
</script>

<h1 class="text-2xl md:text-lg">Welcome!</h1>
<hr class="border-0 bg-surface-500 text-surface-500 h-px">
<p>Your verification code is:</p>
<div class="mt-4 flex items-center gap-x-4">
	{#each OTPDigits as digit}
		<div
			class="flex h-10 w-10 items-center justify-center rounded-md border border-primary-500 text-2xl font-medium text-primary-500 dark:border-primary-400 dark:text-primary-400"
		>
			{digit}
		</div>
	{/each}
</div>
