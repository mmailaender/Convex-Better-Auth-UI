<script lang="ts">
	import { tv } from 'tailwind-variants';
	import { usePasswordStrength } from './password.svelte.js';
	import type { PasswordStrengthProps } from './types.js';
	import { Progress } from '@ark-ui/svelte';
	import { cn } from '$lib/primitives/utils.js';

	let { strength = $bindable(), class: className }: PasswordStrengthProps = $props();

	const state = usePasswordStrength();

	const score = $derived(state.strength.score);

	$effect(() => {
		strength = state.strength;
	});

	const color = tv({
		base: '',
		variants: {
			score: {
				0: 'bg-error-600-400',
				1: 'bg-error-600-400',
				2: 'bg-warning-700-300',
				3: 'bg-warning-600-400',
				4: 'bg-success-600-400'
			}
		}
	});
</script>

<Progress.Root
	value={state.strength.score}
	class={cn('bg-surface-200-800 relative h-1 w-full gap-1 overflow-hidden rounded-full', className)}
	min={0}
	max={4}
>
	<div
		class={cn('h-full transition-all duration-500', color({ score }))}
		style="width: {(score / 4) * 100}%;"
	></div>
	<!-- This creates the gaps between the bars -->
	<div class="absolute top-0 left-0 z-10 flex h-1 w-full place-items-center gap-1 px-0.5">
		{#each Array.from({ length: 4 }) as _, i (i)}
			<div class="ring-surface-100-900 h-1 w-1/4 rounded-full ring-3"></div>
		{/each}
	</div>
</Progress.Root>
