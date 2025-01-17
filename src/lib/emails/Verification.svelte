<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} [firstName]
	 * @property {string} OTP
	 * @property {string} baseURL
	 */

	/** @type {Props} */
	let { firstName = 'World', OTP, baseURL } = $props();
</script>

<p class="text-[24px] md:text-[18px]">
	Hello, {firstName}!
</p>
<hr class="border-0 bg-surface-500 text-surface-500 h-px">
<a href={`${baseURL}/user-profile?otp=${OTP}`}>Verify your email</a>
