<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} OTP
	 */

	/** @type {Props} */
	let { OTP } = $props();
</script>

<h1 class="h2">Verification code</h1>
<p>Enter the following verification code when prompted:</p>
<p class="h1">{OTP}</p>
<p>To protect your account, do not share this code.</p>
