<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { ActionResult } from '@sveltejs/kit';

	let name = $state('');
	let slug = $state('');
	let logo = $state('');

	function generateSlug(input: string) {
		return input.toLowerCase().replace(/\s+/g, '-');
	}

	function handleNameInput(event: Event) {
		const input = (event.target as HTMLInputElement).value;
		name = input;
		slug = generateSlug(input);
	}

	function handleSubmit() {
		return async ({ result }: { result: ActionResult }) => {
			if (result.type === 'success') {
				console.log('Organization created successfully - invalidateAll');
				goto('/', { invalidateAll: true });
			}
		};
	}
</script>

<form method="POST" action="/api/org?/createOrganization" use:enhance={handleSubmit}>
	<h2 class="mb-4 text-2xl font-bold">Create Organization</h2>

	<div class="mb-4">
		<label for="avatar">Logo</label>
		<input
			type="url"
			id="logo"
			name="logo"
			bind:value={logo}
			placeholder="https://example.com/logo.png"
			class="input"
		/>
	</div>

	<div class="mb-4">
		<label for="name">Name</label>
		<input
			type="text"
			id="name"
			name="name"
			bind:value={name}
			oninput={handleNameInput}
			required
			class="input"
		/>
	</div>

	<div class="mb-4">
		<label for="slug">Slug URL</label>
		<input type="text" id="slug" name="slug" bind:value={slug} required class="input" />
	</div>

	<button type="submit" class="btn preset-filled-primary-500">Create Organization</button>
</form>
