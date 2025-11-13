<script lang="ts">
	import { Menu as MenuPrimitive } from '@ark-ui/svelte';
	let {
		ref = $bindable(null),
		value = $bindable(),
		...restProps
	}: MenuPrimitive.RadioItemGroupProps = $props();
</script>

<MenuPrimitive.RadioItemGroup bind:ref bind:value data-slot="menu-radio-group" {...restProps} />
