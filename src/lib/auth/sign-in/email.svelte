<script>
	const handleEmailLogin = () => {
		// Add your email login logic here
	};
</script>

<div id="auth_email-login" class="flex flex-col gap-4">
    <label class="label flex flex-col items-start">
        <span class="label-text">Email</span>
        <input type="email" placeholder="example@gmail.com" class="input w-full" />
    </label>
    <button class="btn w-full preset-filled" on:click={handleEmailLogin}> Continue </button>
</div>