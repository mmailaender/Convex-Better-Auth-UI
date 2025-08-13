<script lang="ts">
	import { Select, type SelectLabelProps } from '@ark-ui/svelte/select';
	import { cn } from '$lib/primitives/utils.js';

	let { class: className, children, ...restProps }: SelectLabelProps = $props();
</script>

<Select.Label
	data-slot="select-label"
	class={cn('text-muted-foreground px-2 py-1.5 text-xs', className)}
	{...restProps}
>
	{@render children?.()}
</Select.Label>
