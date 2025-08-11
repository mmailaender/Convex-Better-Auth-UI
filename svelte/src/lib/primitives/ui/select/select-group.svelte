<script lang="ts">
	import { Select, type SelectItemGroupProps } from '@ark-ui/svelte/select';

	let { ref = $bindable(null), children, ...restProps }: SelectItemGroupProps = $props();
</script>

<Select.ItemGroup bind:ref data-slot="select-group" {...restProps}>
	{@render children?.()}
</Select.ItemGroup>
