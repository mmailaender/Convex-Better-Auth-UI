<script>
	import { Github,Google, Facebook, Apple } from './icons';

	const handleGoogleLogin = () => {
		// Add your Google login logic here
	};

	const handleFacebookLogin = () => {
		// Add your Facebook login logic here
	};

	const handleAppleLogin = () => {
		// Add your Apple login logic here
	};
</script>

<div id="auth_social-login" class="flex flex-col gap-3">
    <a
        class="btn flex items-center gap-2 preset-filled-surface-100-900"
        href="/sign-in/github"
    >
        <Github class="size-5 dark:fill-white" />
        Continue with GitHub
    </a>
    <button
        class="btn flex items-center gap-2 preset-filled-surface-100-900"
        on:click={handleGoogleLogin}
    >
        <Google class="size-5" />
        Continue with Google
    </button>
    <button
        class="btn flex items-center gap-2 preset-filled-surface-100-900"
        on:click={handleFacebookLogin}
    >
        <Facebook class="size-5" />
        Continue with Facebook
    </button>
    <button
        class="btn flex items-center gap-2 preset-filled-surface-100-900"
        on:click={handleAppleLogin}
    >
        <Apple class="size-5 dark:fill-white" />
        Continue with Apple
    </button>
</div>